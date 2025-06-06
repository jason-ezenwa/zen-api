import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import config from "./config";
import { job } from "./cron-job";
import setupRoutes from "./routes";
const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
// logger middleware
app.use((req, res, next) => {
  const requestTime = new Date().toLocaleString();
  console.log(req.method, req.hostname, req.path, requestTime);
  next();
});

// Set up all routes
setupRoutes(app);

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
