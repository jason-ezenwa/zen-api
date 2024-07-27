import { Request, Response } from 'express';
import redisClient from '../../redisClient';
import { NotFoundError, BadRequestError } from '../../errors';
import currencyExchangeService from '../services/currency-exchange.service';

class CurrencyExchangeController {
  async generateFXQuote(req: any, res: any) {
    const { sourceCurrency, targetCurrency, amount } = req.body;

    if (!sourceCurrency) {
      res.status(400).json({ error: 'sourceCurrency is required.' });
      return;
    }

    if (!targetCurrency) {
      res.status(400).json({ error: 'targetCurrency is required.' });
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required.' });
      return;
    }

    try {
      const { sourceAmount, targetAmount, exchangeRate, quoteReference } = await currencyExchangeService.generateFXQuoteFromMaplerad(
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
        message: 'FX quote generated successfully',
        quoteReference,
        sourceAmount,
        targetAmount,
        exchangeRate
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async exchangeCurrency(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const { quoteReference } = req.body;

      await currencyExchangeService.exchangeCurrency(userId, quoteReference);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      }

      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default CurrencyExchangeController;
