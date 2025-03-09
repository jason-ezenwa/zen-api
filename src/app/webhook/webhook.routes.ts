import { Router } from "express";
import webhookController from "./webhook.controller";

const router = Router();

// Bind ensures the correct 'this' context
router.post("/", webhookController.handleWebhook.bind(webhookController));

export default router;
