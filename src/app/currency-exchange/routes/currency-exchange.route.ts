import { Router } from 'express';
import CurrencyExchangeController from '../controllers/currency-exchange.controller';

const router = Router();
const currencyExchangeController = new CurrencyExchangeController();

router.post('/generate-quote', (req, res) => currencyExchangeController.generateFXQuote(req, res));
router.post('/exchange-currency', (req, res) => currencyExchangeController.exchangeCurrency(req, res));

export default router;
