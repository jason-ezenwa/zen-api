import { Request, Response } from "express";
import webhookService from "./webhook.service";
import { WalletService } from "../wallets/services/wallet.service";
import { PaystackService } from "../paystack/paystack.service";
import { logEvent } from "../../utils";

class WebhookController {
  constructor(private readonly walletService: WalletService) {}
  async handleWebhook(req: Request, res: Response) {
    logEvent("info", "Webhook received", {
      body: req.body,
    });

    if (req.body.event === "issuing.created.successful") {
      webhookService.handleCardCreation(req);
    }

    if (req.body.event === "issuing.created.failed") {
      webhookService.handleCardCreationFailed(req);
    }

    if (req.body.event === "charge.success") {
      await this.walletService.creditWalletFollowingDeposit(
        req.body.data.reference
      );
    }

    return res.status(200).send("Webhook received");
  }
}

export default new WebhookController(new WalletService(new PaystackService()));
