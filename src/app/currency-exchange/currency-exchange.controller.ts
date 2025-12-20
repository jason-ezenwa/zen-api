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
import { GenerateFXQuoteDto } from "../common/dtos/fx/generate-quote.dto";
import { ExchangeCurrencyDto } from "../common/dtos/fx/exchange-currency.dto";
import { CurrencyExchangeService } from "./currency-exchange.service";

@Service()
@JsonController("/fx")
export class CurrencyExchangeController {
  constructor(
    private readonly currencyExchangeService: CurrencyExchangeService
  ) {}

  @Post("/quote")
  async generateFXQuote(@Body() quoteDto: GenerateFXQuoteDto) {
    return await this.currencyExchangeService.generateFXQuote(quoteDto);
  }

  @Post("/exchange-currency")
  @Authorized()
  async exchangeCurrency(
    @Body() exchangeDto: ExchangeCurrencyDto,
    @Req() req: Request
  ) {
    const userId = req.user.id;

    const fxTransaction = await this.currencyExchangeService.exchangeCurrency(
      userId,
      exchangeDto.quoteReference
    );

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
    const result = await this.currencyExchangeService.getUserFXTransactions(
      dto
    );
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
