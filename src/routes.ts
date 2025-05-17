import { Application } from "express";
import authRoutes from "./app/authentication/routes/auth.routes";
import walletRoutes from "./app/wallets/routes/wallets.routes";
import currencyExchangeRoutes from "./app/currency-exchange/routes/currency-exchange.route";
import virtualCardsRoutes from "./app/virtual-cards/virtual-cards.routes";
import webhookRoutes from "./app/webhook/webhook.routes";
import usersRoutes from "./app/users/routes";

const setupRoutes = (app: Application) => {
  app.get("/", (req, res) => res.send("Hello, welcome to the ZEN API"));
  app.use("/api/auth", authRoutes);
  app.use("/api/wallets", walletRoutes);
  app.use("/api/fx", currencyExchangeRoutes);
  app.use("/api/virtual-cards", virtualCardsRoutes);
  app.use("/api/webhook", webhookRoutes);
  app.use("/api/users", usersRoutes);
};

export default setupRoutes;
