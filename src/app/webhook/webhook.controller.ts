import { JsonController, Post, Req, Res } from "routing-controllers";
import { Service } from "typedi";
import { Request, Response } from "express";
import webhookService from "./webhook.service";
import { WalletService } from "../wallets/services/wallet.service";
import { PaystackService } from "../paystack/paystack.service";
import { logEvent } from "../../utils";
import { UnauthorizedError } from "../errors";

const mapleradIPAddresses = [
  "54.216.8.72",
  "54.173.54.49",
  "52.215.16.239",
  "52.55.123.25",
  "52.6.93.106",
  "63.33.109.123",
  "44.228.126.217",
  "50.112.21.217",
  "52.24.126.164",
  "54.148.139.208",
];

const checkMapleradIPAddress = (requestIPAddress: string) => {
  const ipAddress = requestIPAddress.includes(":")
    ? requestIPAddress.split(":")[0]
    : requestIPAddress;

  if (!mapleradIPAddresses.includes(ipAddress)) {
    logEvent(
      "error",
      "Unauthorized request for card creation from IP address",
      {
        ipAddress,
      }
    );

    throw new UnauthorizedError("Unauthorized request");
  }
  return mapleradIPAddresses.includes(ipAddress);
};

@Service()
@JsonController("/webhook")
export class WebhookController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    let requestIPAddress =
      (req.headers["x-real-ip"] as string) ||
      (req.headers["true-client-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string);

    logEvent("info", "Webhook received", {
      body: req.body,
    });

    if (req.body.event === "issuing.created.successful") {
      checkMapleradIPAddress(requestIPAddress);
      webhookService.handleCardCreation(req);
    }

    if (req.body.event === "issuing.created.failed") {
      checkMapleradIPAddress(requestIPAddress);
      webhookService.handleCardCreationFailed(req);
    }

    if (req.body.event === "charge.success") {
      logEvent("info", "Credit wallet following deposit", {
        reference: req.body.data.reference,
      });
      await this.walletService.creditWalletFollowingDeposit(
        req.body.data.reference
      );
    }

    return res.status(200).send("Webhook received");
  }
}
