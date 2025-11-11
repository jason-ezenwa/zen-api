import "reflect-metadata";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { useExpressServer, useContainer } from "routing-controllers";
import { Container } from "typedi";
import config from "./config";

// Import all controllers
import controllers from "./controllers";

// Import middleware
import { ErrorHandler } from "./middlewares/error-handler";
import { authorizationChecker } from "./middlewares/auth-checker";

// Global error handlers to handle crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // crash + restart
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // crash + restart
});

// Set up dependency injection container
useContainer(Container);

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

// logger middleware
app.use((req, res, next) => {
  const requestTime = new Date().toLocaleString();
  console.log(req.method, req.hostname, req.path, requestTime);
  next();
});

// Setup routing-controllers
useExpressServer(app, {
  routePrefix: "/api",
  controllers: controllers,
  middlewares: [ErrorHandler],
  authorizationChecker: authorizationChecker,
  defaultErrorHandler: false, // We handle errors manually
  validation: {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
  },
});

// root route
app.get("/", (req, res) => res.send("Hello, welcome to the ZEN API"));

mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const port = config.port || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
