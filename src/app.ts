import express from 'express';
import mongoose from 'mongoose';
import config from './config';
import authRoutes from './app/authentication/routes/auth.routes';
import walletRoutes from './app/wallets/routes/wallets.routes';
import currencyExchangeRoutes from './app/currency-exchange/routes/currency-exchange.route';
import virtualCardsRoutes from "./app/virtual-cards/virtual-cards.routes";
import webhookRoutes from "./app/webhook/webhook.routes";
import { job } from "./cron-job";

const app = express();

app.use(express.json());
// logger middleware
app.use((req, res, next) => {
	const requestTime = new Date().toLocaleString();
	console.log(req.method, req.hostname, req.path, requestTime);
	next();
});
app.get("/", (req, res) => res.send("Hello, welcome to the ZEN API"));
app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/fx", currencyExchangeRoutes);
app.use("/api/virtual-cards", virtualCardsRoutes);
app.use("/api/webhook", webhookRoutes);

mongoose
	.connect(config.mongoURI)
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error(err));

const port = config.port || 5000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
	job.start();
});
export default app;
