import { AuthController } from "./app/authentication/auth.controller";
import { UsersController } from "./app/users/users.controller";
import { WalletController } from "./app/wallets/wallet.controller";
import { VirtualCardsController } from "./app/virtual-cards/virtual-cards.controller";
import { CurrencyExchangeController } from "./app/currency-exchange/currency-exchange.controller";
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
