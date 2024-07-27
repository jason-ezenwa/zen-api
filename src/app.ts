import express from 'express';
import mongoose from 'mongoose';
import config from './config';
import authRoutes from './app/authentication/routes/auth.routes';
import walletRoutes from './app/wallets/routes/wallets.routes';
// Import other routes here as needed

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);

mongoose.connect(config.mongoURI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

export default app;
