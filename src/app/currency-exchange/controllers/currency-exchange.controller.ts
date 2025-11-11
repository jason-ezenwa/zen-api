import {
  JsonController,
  Post,
  Get,
  Authorized,
  Body,
  Req,
  QueryParam,
} from "routing-controllers";
import { Service } from "typedi";
import { Request } from "express";
import redisClient from "../../redisClient";
import currencyExchangeService from "../services/currency-exchange.service";
import { GenerateFXQuoteDto } from "../../common/dtos/fx/generate-quote.dto";
import { ExchangeCurrencyDto } from "../../common/dtos/fx/exchange-currency.dto";

@Service()
@JsonController("/fx")
export class CurrencyExchangeController {
  @Post("/quote")
  async generateFXQuote(@Body() quoteDto: GenerateFXQuoteDto) {
    const { sourceAmount, targetAmount, exchangeRate, quoteReference } =
      await currencyExchangeService.generateFXQuoteFromMaplerad(
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

  @Post("/exchange")
  @Authorized()
  async exchangeCurrency(
    @Body() exchangeDto: ExchangeCurrencyDto,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    const fxTransaction = await currencyExchangeService.exchangeCurrency(
      userId,
      exchangeDto.quoteReference
    );

    if (!fxTransaction) {
      throw new Error(
        "Unable to process currency exchange, please try again later."
      );
    }

    const obj = fxTransaction.toObject();
    return {
      message: "Currency exchanged successfully",
      fxTransaction: {
        ...obj,
        _id: obj._id.toString(),
        user: obj.user?.toString() || obj.user,
      },
    };
  }

  @Get("/transactions")
  @Authorized()
  async getMyFXTransactions(
    @Req() req: Request,
    @QueryParam("page") page?: number
  ) {
    const userId = req.user.id;
    const dto = {
      userId,
      page: page || 1,
    };
    const result = await currencyExchangeService.getUserFXTransactions(dto);
    return {
      ...result,
      fxTransactions: result.fxTransactions.map((transaction) => {
        const obj = transaction.toObject();
        return {
          ...obj,
          _id: obj._id.toString(),
          user: obj.user?.toString() || obj.user,
        };
      }),
    };
  }
}
