import express from 'express';
import mongoose from 'mongoose';
import config from './config';
import authRoutes from './authentication/routes/auth.routes';
// Import other routes here as needed

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
// Use other routes here as needed

mongoose.connect(config.mongoURI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

export default app;
