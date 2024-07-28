import { Router } from 'express';
import CurrencyExchangeController from '../controllers/currency-exchange.controller';
import { authenticate } from '../../authentication/middlewares/auth.middleware';

const router = Router();

router.post('/generate-quote', CurrencyExchangeController.generateFXQuote);
router.post('/exchange-currency', authenticate, CurrencyExchangeController.exchangeCurrency);

export default router;
