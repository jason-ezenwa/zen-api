import express from 'express';
import mongoose from 'mongoose';
import config from './config';
import authRoutes from './app/authentication/routes/auth.routes';
import walletRoutes from './app/wallets/routes/wallets.routes';
import currencyExchangeRoutes from './app/currency-exchange/routes/currency-exchange.route';
// Import other routes here as needed

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/fx', currencyExchangeRoutes)

mongoose.connect(config.mongoURI)
.then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


const port = config.port || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
export default app;
