import { Request, Response } from 'express';
import redisClient from '../../redisClient';
import { NotFoundError, BadRequestError } from '../../errors';
import currencyExchangeService from '../services/currency-exchange.service';

class CurrencyExchangeController {
  async generateFXQuote(req: any, res: any) {
    const { sourceCurrency, targetCurrency, amount } = req.body;

    if (!sourceCurrency) {
      return res.status(400).json({ error: 'sourceCurrency is required.' });
      return;
    }

    if (!targetCurrency) {
      return res.status(400).json({ error: 'targetCurrency is required.' });
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
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

      const exchanged = await currencyExchangeService.exchangeCurrency(userId, quoteReference);

      if (exchanged) {
        return res.status(200).json({ message: 'Currency exchanged successfully' });
      } else {
        throw new Error('Unable to process currency exchange, please try again later.');
      }

    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message });
      }

      console.log('Error exchanging currency:', error);

      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new CurrencyExchangeController();
