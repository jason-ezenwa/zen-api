import { Request } from "express";
import VirtualCardRequestModel from "../virtual-cards/models/virtual-card-request.model";
import VirtualCardModel, {
	VirtualCard,
} from "../virtual-cards/models/virtual-card.model";
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

class WebhookService {
	async handleCardCreation(req: Request) {
		try {
			let requestIPAddress = req.headers["x-real-ip"] as string;

			if (!requestIPAddress) {
				requestIPAddress = req.headers["true-client-ip"] as string;
			}

			if (!mapleradIPAddresses.includes(requestIPAddress)) {
				console.log(
					"Unauthorized request for card creation from IP address:",
					requestIPAddress
				);

				console.log({ headers: req.headers, body: req.body });

				throw new UnauthorizedError("Unauthorized request");
			}

			const cardReference = req.body.reference;

			const virtualCardRequest = await VirtualCardRequestModel.findOne({
				cardReference,
			});

			if (!virtualCardRequest) {
				throw new Error("Virtual card request not found");
			}

			await VirtualCardRequestModel.updateOne(
				{ cardReference },
				{ status: "SUCCESS" }
			);

			const { id, name, masked_pan, type, issuer, currency, status } =
				req.body.card;

			const existingVirtualCard = await VirtualCardModel.findOne({
				cardReference,
			});

			if (existingVirtualCard) {
				throw new Error("Virtual card already exists");
			}

			const virtualCard = new VirtualCard();

			virtualCard.user = virtualCardRequest.user;
			virtualCard.cardReference = cardReference;
			virtualCard.cardId = id;
			virtualCard.name = name;
			virtualCard.maskedPan = masked_pan;
			virtualCard.type = type;
			virtualCard.issuer = issuer;
			virtualCard.currency = currency;
			virtualCard.status = status;

			await VirtualCardModel.create(virtualCard);

			return true;
		} catch (error) {
			console.log(error);
			throw new Error("Internal Server Error");
		}
	}

	async handleCardCreationFailed(req: Request) {
		try {
			const requestIPAddress = req.headers["x-real-ip"] as string;

			if (!mapleradIPAddresses.includes(requestIPAddress)) {
				throw new UnauthorizedError("Unauthorized request");
			}

			const cardReference = req.body.reference;

			const virtualCardRequest = await VirtualCardRequestModel.findOne({
				cardReference,
			});

			if (!virtualCardRequest) {
				throw new Error("Virtual card request not found");
			}

			await VirtualCardRequestModel.updateOne(
				{ cardReference },
				{ status: "FAILED" }
			);
		} catch (error) {
			console.log(error);
			throw new Error("Internal Server Error");
		}
	}
}

export default new WebhookService();
