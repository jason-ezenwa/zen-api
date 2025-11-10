import { AuthController } from "./app/authentication/controllers/auth.controller";
import { UsersController } from "./app/users/controllers/users.controller";
import { WalletController } from "./app/wallets/controllers/wallet.controller";
import { VirtualCardsController } from "./app/virtual-cards/controllers/virtual-cards.controller";
import { CurrencyExchangeController } from "./app/currency-exchange/controllers/currency-exchange.controller";
import { WebhookController } from "./app/webhook/webhook.controller";

const controllers = [
  AuthController,
  UsersController,
  WalletController,
  VirtualCardsController,
  CurrencyExchangeController,
  WebhookController,
];

export default controllers;