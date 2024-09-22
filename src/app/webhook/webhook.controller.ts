import { Request, Response } from "express";
import webhookService from "./webhook.service";

class WebhookController {
	async handleWebhook(req: Request, res: Response) {
		if (req.body.event === "issuing.created.successful") {
			webhookService.handleCardCreation(req);
		}

		if (req.body.event === "issuing.created.failed") {
			webhookService.handleCardCreationFailed(req);
		}

		return res.status(200).send("Webhook received");
	}
}

export default new WebhookController();
