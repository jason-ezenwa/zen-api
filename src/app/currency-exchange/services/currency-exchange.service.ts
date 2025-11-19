import axios from 'axios';
import { NotFoundError } from '../../errors';
import redisClient from '../../redisClient';
import WalletModel from '../../wallets/models/wallet.model';
import UserModel from '../../users/models/user.model';
import MarginModel from '../../margins/models/margin';
import { GetUserRecordsDto } from "../../common/dtos";
import { logEvent } from "../../../utils";
import CurrencyExchangeModel from "../models/currency-exchange";
import { CurrencyExchange } from "../models/currency-exchange";
import { TransactionStatus } from "../../../types";
import { GenerateFXQuoteDto } from "../../common/dtos/fx/generate-quote.dto";

interface FXQuoteResponse {
  sourceAmount: number;
  targetAmount: number;
  exchangeRate: number;
  quoteReference: string;
}

interface ParsedFXQuote {
  sourceAmount: number;
  targetAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
}

interface MapleradQuoteData {
  reference: string;
  rate: string;
}

class CurrencyExchangeService {
  public async getCurrencyExchangeMarginFromDb() {
    return MarginModel.findOne();
  }

  public async generateFXQuoteFromMaplerad(
    sourceCurrency: string,
    targetCurrency: string,
    amount: number
  ): Promise<FXQuoteResponse> {
    try {
      const mapleradOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
        },
        url: "https://sandbox.api.maplerad.com/v1/fx/quote",
        data: {
          source_currency: sourceCurrency,
          target_currency: targetCurrency,
          amount: amount * 100, // the lowest denomination of the card's currency; cents for USD, kobo for NGN
        },
      };

      const response = await axios(mapleradOptions);
      const quoteData: MapleradQuoteData = response.data.data;

      // inputting our margin
      const exchangeRateMargin = await this.getCurrencyExchangeMarginFromDb();

      if (!exchangeRateMargin) {
        throw new Error("Currency exchange margin not found");
      }

      const { margin } = exchangeRateMargin;

      const ratePercentageAmount = margin * parseFloat(quoteData.rate);

      const exchangeRate = parseFloat(quoteData.rate) - ratePercentageAmount; // remove margin % of the exchange rate
      const targetAmount = amount * exchangeRate;
      const sourceAmount = amount;
      const quoteReference = quoteData.reference;

      return {
        sourceAmount,
        targetAmount,
        exchangeRate,
        quoteReference,
      };
    } catch (error: any) {
      console.error(
        "Error generating FX quote:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async generateFXQuote(quoteDto: GenerateFXQuoteDto) {
    const { sourceAmount, targetAmount, exchangeRate, quoteReference } =
      await this.generateFXQuoteFromMaplerad(
        quoteDto.sourceCurrency,
        quoteDto.targetCurrency,
        quoteDto.amount
      );

    const fxQuote = JSON.stringify({
      sourceAmount,
      sourceCurrency: quoteDto.sourceCurrency,
      targetAmount,
      targetCurrency: quoteDto.targetCurrency,
      reference: quoteReference,
      exchangeRate,
    });

    const fxQuoteKey = `fx_${quoteReference}`;
    const redis = await redisClient;
    await redis.set(fxQuoteKey, fxQuote);
    await redis.expire(fxQuoteKey, 180);

    return {
      message: "FX quote generated successfully",
      quoteReference,
      sourceAmount,
      targetAmount,
      exchangeRate,
    };
  }

  public async exchangeCurrencyOnMaplerad(quoteReference: string) {
    try {
      const mapleradOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
        },
        url: "https://sandbox.api.maplerad.com/v1/fx",
        data: {
          quote_reference: quoteReference,
        },
      };

      const response = await axios(mapleradOptions);
      if (response.data.status === true) {
        return response.data;
      }
      throw new Error(
        "Unable to process currency exchange, please try again later."
      );
    } catch (error: any) {
      logEvent("error", "Error processing currency exchange:", {
        error,
      });

      throw error;
    }
  }

  async exchangeCurrency(userId: string, quoteReference: string) {
    const redis = await redisClient;

    const fxQuoteKey = `fx_${quoteReference}`;

    try {
      let fxQuote = await redis.get(fxQuoteKey);

      if (!fxQuote) {
        throw new NotFoundError("FX Quote not found");
      }

      const parsedFxQuote: ParsedFXQuote = JSON.parse(fxQuote);

      const { sourceAmount, targetAmount, sourceCurrency, targetCurrency } =
        parsedFxQuote;

      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const sourceCurrencyWallet = await WalletModel.findOne({
        currency: sourceCurrency,
        user: user._id,
      });

      const targetCurrencyWallet = await WalletModel.findOne({
        currency: targetCurrency,
        user: user._id,
      });

      if (!sourceCurrencyWallet) {
        throw new NotFoundError(
          `User does not have a ${sourceCurrency} wallet`
        );
      }

      if (!targetCurrencyWallet) {
        throw new NotFoundError(
          `User does not have a ${targetCurrency} wallet`
        );
      }

      if (sourceCurrencyWallet.balance < sourceAmount) {
        throw new Error("Insufficient balance");
      }

      await this.exchangeCurrencyOnMaplerad(quoteReference);

      // TODO: implement exchange in wallets
      await sourceCurrencyWallet.updateOne({
        $inc: { balance: -sourceAmount },
      });

      await targetCurrencyWallet.updateOne({
        $inc: { balance: targetAmount },
      });

      const fxTransaction = new CurrencyExchange();

      fxTransaction.user = user._id;
      fxTransaction.sourceCurrency = sourceCurrency;
      fxTransaction.targetCurrency = targetCurrency;
      fxTransaction.sourceAmount = sourceAmount;
      fxTransaction.targetAmount = targetAmount;
      fxTransaction.status = TransactionStatus.COMPLETED;
      fxTransaction.reference = fxQuoteKey;

      const createdFxTransaction = await CurrencyExchangeModel.create(
        fxTransaction
      );

      await redis.del(fxQuoteKey); // quote is no longer valid

      return createdFxTransaction;
    } catch (error) {
      await redis.del(fxQuoteKey); // quote is no longer valid
      throw error;
    }
  }

  async getUserFXTransactions(getUserRecordsDto: GetUserRecordsDto) {
    try {
      logEvent("info", "Getting user fx transactions", {
        ...getUserRecordsDto,
      });

      const { userId, page = 1 } = getUserRecordsDto;

      const numberOfRecordsPerPage = 10;

      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const fxTransactions = await CurrencyExchangeModel.find(
        { user: user._id },
        null,
        {
          skip: (page - 1) * numberOfRecordsPerPage,
          limit: numberOfRecordsPerPage,
          sort: { createdAt: -1 },
        }
      );

      const totalRecords = await CurrencyExchangeModel.countDocuments({
        user: user._id,
      });

      const totalPages = Math.ceil(totalRecords / numberOfRecordsPerPage);

      return {
        fxTransactions,
        totalPages,
        page,
        totalRecords,
        numberOfRecordsPerPage,
      };
    } catch (error) {
      logEvent("error", "Error getting user fx transactions", {
        error,
      });

      throw error;
    }
  }
}

export default new CurrencyExchangeService();
