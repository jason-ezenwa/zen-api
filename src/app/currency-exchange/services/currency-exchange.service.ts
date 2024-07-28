import axios from 'axios';
import { NotFoundError } from '../../errors';
import redisClient from '../../redisClient';
import WalletModel from '../../wallets/models/wallet.model';
import UserModel from '../../users/models/user.model';
import MarginModel from '../../margins/models/margin';

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
  public async getCurrencyExchangeMarginFromDb(): Promise<any> {
    try {
      const currencyExchangeMargin = await MarginModel.findOne();
      return currencyExchangeMargin;
    } catch (error) {
      throw error;
    }
  }

  public async generateFXQuoteFromMaplerad(
    sourceCurrency: string,
    targetCurrency: string,
    amount: number
  ): Promise<FXQuoteResponse> {
    try {
      const mapleradOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
        },
        url: 'https://sandbox.api.maplerad.com/v1/fx/quote',
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
      const { margin } = exchangeRateMargin;
      const ratePercentageAmount = parseFloat(margin) * parseFloat(quoteData.rate);

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
      console.error('Error generating FX quote:', error.response?.data || error.message);
      throw error;
    }
  }

  public async exchangeCurrencyOnMaplerad(quoteReference: string): Promise<any> {
    try {
      const mapleradOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
        },
        url: 'https://sandbox.api.maplerad.com/v1/fx',
        data: {
          quote_reference: quoteReference,
        },
      };

      const response = await axios(mapleradOptions);
      if (response.data.status === true) {
        return response.data;
      }
      throw new Error('Unable to process currency exchange, please try again later.');
    } catch (error: any) {
      console.error('Error processing currency exchange:', error.response?.data || error.message);
      throw error;
    }
  }

  async exchangeCurrency(userId: string, quoteReference: string): Promise<any> {
    const redis = await redisClient;

    const fxQuoteKey = `fx_${quoteReference}`;

    try {
      let fxQuote = await redis.get(fxQuoteKey);

      if (!fxQuote) {
        throw new NotFoundError('FX Quote not found');
      }

      const parsedFxQuote: ParsedFXQuote = JSON.parse(fxQuote);

      const { sourceAmount, targetAmount, sourceCurrency, targetCurrency } = parsedFxQuote;

      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
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
        throw new NotFoundError(`User does not have a ${sourceCurrency} wallet`);
      }

      if (!targetCurrencyWallet) {
        throw new NotFoundError(`User does not have a ${targetCurrency} wallet`);
      }

      if (sourceCurrencyWallet.balance < sourceAmount) {
        throw new Error('Insufficient balance');
      }
      
      await this.exchangeCurrencyOnMaplerad(quoteReference);

      // TODO: implement exchange in wallets
      sourceCurrencyWallet.balance -= sourceAmount;

      targetCurrencyWallet.balance += targetAmount;

      await sourceCurrencyWallet.save();

      await targetCurrencyWallet.save();
      
      await redis.del(fxQuoteKey); // quote is no longer valid

      return true;
    } catch (error) {
      await redis.del(fxQuoteKey); // quote is no longer valid
      throw error;
    }
  }
}

export default new CurrencyExchangeService();
