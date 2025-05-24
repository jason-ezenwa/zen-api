import { Request, Response } from 'express';
import redisClient from '../../redisClient';
import { NotFoundError, BadRequestError } from '../../errors';
import currencyExchangeService from '../services/currency-exchange.service';
import { validateWithSchema } from "../../../utils";
import { getUserRecordsSchema } from "../../common/dtos";

class CurrencyExchangeController {
  async generateFXQuote(req: any, res: any) {
    const { sourceCurrency, targetCurrency, amount } = req.body;

    if (!sourceCurrency) {
      return res.status(400).json({ error: "sourceCurrency is required." });
      return;
    }

    if (!targetCurrency) {
      return res.status(400).json({ error: "targetCurrency is required." });
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required." });
      return;
    }

    try {
      const { sourceAmount, targetAmount, exchangeRate, quoteReference } =
        await currencyExchangeService.generateFXQuoteFromMaplerad(
          sourceCurrency,
          targetCurrency,
          amount
        );

      const fxQuote = JSON.stringify({
        sourceAmount,
        sourceCurrency,
        targetAmount,
        targetCurrency,
        reference: quoteReference,
        exchangeRate,
      });
      const fxQuoteKey = `fx_${quoteReference}`;
      const redis = await redisClient;
      await redis.set(fxQuoteKey, fxQuote);
      await redis.expire(fxQuoteKey, 180);

      return res.status(200).json({
        message: "FX quote generated successfully",
        quoteReference,
        sourceAmount,
        targetAmount,
        exchangeRate,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async exchangeCurrency(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const { quoteReference } = req.body;

      const fxTransaction = await currencyExchangeService.exchangeCurrency(
        userId,
        quoteReference
      );

      if (fxTransaction) {
        return res
          .status(200)
          .json({ message: "Currency exchanged successfully", fxTransaction });
      } else {
        throw new Error(
          "Unable to process currency exchange, please try again later."
        );
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message });
      }

      console.log("Error exchanging currency:", error);

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getMyFXTransactions(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const { page = 1 } = req.query;

      const dto = validateWithSchema(getUserRecordsSchema, {
        userId,
        page,
      });

      const result = await currencyExchangeService.getUserFXTransactions(dto);

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new CurrencyExchangeController();
