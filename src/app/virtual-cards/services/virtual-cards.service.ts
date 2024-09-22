import axios from "axios";
import { NotFoundError } from "../../errors";
import UserMapleRadAccountModel from "../../users/models/user-maplerad-account.model";
import UserModel from "../../users/models/user.model";
import VirtualCardRequestModel from "../models/virtual-card-request.model";
import WalletModel from "../../wallets/models/wallet.model";
import USDVirtualCardFeesModel from "../../fees/models/usd-virtual-card-fees";
import VirtualCardModel from "../models/virtual-card.model";
import { ObjectId } from "mongodb";

class VirtualCardService {
	async createVirtualCard(
		userId: string,
		currency: string,
		brand: string,
		cardPin: string
	) {
		try {
			const user = await UserModel.findById(userId);

			if (!user) {
				throw new NotFoundError("User not found");
			}

			const userMapleRadAccount = await UserMapleRadAccountModel.findOne({
				user: user._id,
			});

			if (!userMapleRadAccount) {
				throw new NotFoundError("User MapleRad account not found");
			}

			const userCurrencyWallet = await WalletModel.findOne({
				user: user._id,
				currency,
			});

			if (!userCurrencyWallet) {
				throw new NotFoundError(`User does not have a ${currency} wallet`);
			}

			const cardCreationFee = await USDVirtualCardFeesModel.findOne({
				name: "Card Creation Fee",
			});

			if (!cardCreationFee) {
				throw new NotFoundError("Card creation fee not found");
			}

			if (userCurrencyWallet.balance < cardCreationFee.fee) {
				throw new Error("Insufficient balance");
			} else {
				const cardRequest = await this.createVirtualCardOnMaplerad(
					userMapleRadAccount.userMapleRadAccountId,
					currency,
					brand,
					cardPin
				);

				// decrement user's wallet balance by card creation fee
				await userCurrencyWallet.updateOne({
					balance: userCurrencyWallet.balance - cardCreationFee.fee,
				});

				return cardRequest;
			}
		} catch (error: any) {
			console.error(
				"Error creating virtual card:",
				error.response?.data || error.message
			);

			throw error;
		}
	}

	async createVirtualCardOnMaplerad(
		userMapleRadAccountId: string,
		currency: string,
		brand: string,
		cardPin: string
	) {
		try {
			const userMapleRadAccount = await UserMapleRadAccountModel.findOne({
				userMapleRadAccountId,
			});

			if (!userMapleRadAccount) {
				throw new NotFoundError("User MapleRad account not found");
			}

			const options = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
				},
				url: "https://sandbox.api.maplerad.com/v1/issuing",
			};

			const response = await axios.post(
				options.url,
				{
					customer_id: userMapleRadAccountId,
					currency,
					brand,
					card_pin: cardPin,
					type: "VIRTUAL",
					auto_approve: true,
				},
				{
					headers: options.headers,
				}
			);

			if (response.data.data) {
				const createdCardRequest = await VirtualCardRequestModel.create({
					user: userMapleRadAccount?.user,
					cardReference: response.data.data.reference,
				});

				return createdCardRequest;
			}

			throw new Error("Unable to create virtual card on Maplerad");
		} catch (error: any) {
			console.error(
				"Error creating virtual card:",
				error.response?.data || error.message
			);
			throw error;
		}
	}

	async getVirtualCardsForUser(userId: string) {
		try {
			const user = await UserModel.findById(userId);

			if (!user) {
				throw new NotFoundError("User not found");
			}

			const virtualCards = await VirtualCardModel.find({
				user: user._id,
			});

			return virtualCards;
		} catch (error: any) {
			console.error("Error fetching virtual cards:", error.message);
			throw error;
		}
	}

	async getVirtualCard(cardId: string) {
		try {
			const virtualCard = await VirtualCardModel.findOne({
				cardId,
			});

			if (!virtualCard) {
				throw new NotFoundError("Virtual card not found");
			}

			const fullVirtualCardDetails =
				await this.getVirtualCardDetailsFromMaplerad(cardId);

			return fullVirtualCardDetails;
		} catch (error: any) {
			console.error("Error fetching virtual card:", error.message);
			throw error;
		}
	}

	async getVirtualCardDetailsFromMaplerad(cardId: string) {
		try {
			const options = {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
				},
				url: `https://sandbox.api.maplerad.com/v1/issuing/${cardId}`,
			};

			const response = await axios(options);

			if (response.data.data) {
				return response.data.data;
			}

			throw new Error("Unable to fetch virtual card details from Maplerad");
		} catch (error: any) {
			console.error(
				"Error fetching virtual card details:",
				error.response?.data || error.message
			);
			throw error;
		}
	}

	async freezeVirtualCard(cardId: string) {
		try {
			const virtualCard = await VirtualCardModel.findOne({
				cardId,
			});

			if (!virtualCard) {
				throw new NotFoundError("Virtual card not found");
			}

			const options = {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
				},
				url: `https://sandbox.api.maplerad.com/v1/issuing/${cardId}/freeze`,
			};

			const response = await axios(options);

			if (response.data.status) {
				const updatedVirtualCard = await VirtualCardModel.findByIdAndUpdate(
					virtualCard._id,
					{
						status: "DISABLED",
					},
					{ new: true }
				);

				return updatedVirtualCard;
			}

			throw new Error("Unable to freeze virtual card on Maplerad");
		} catch (error: any) {
			console.error(
				"Error freezing virtual card:",
				error.response?.data || error.message
			);
			throw error;
		}
	}

	async unfreezeVirtualCard(cardId: string) {
		try {
			const virtualCard = await VirtualCardModel.findOne({
				cardId,
			});

			if (!virtualCard) {
				throw new NotFoundError("Virtual card not found");
			}

			const options = {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
				},
				url: `https://sandbox.api.maplerad.com/v1/issuing/${cardId}/unfreeze`,
			};

			const response = await axios(options);

			if (response.data.status) {
				const updatedVirtualCard = await VirtualCardModel.findByIdAndUpdate(
					virtualCard._id,
					{
						status: "ACTIVE",
					},
					{ new: true }
				);

				return updatedVirtualCard;
			}

			throw new Error("Unable to unfreeze virtual card on Maplerad");
		} catch (error: any) {
			console.error(
				"Error unfreezing virtual card:",
				error.response?.data || error.message
			);
			throw error;
		}
	}

	async fundVirtualCard(userId: string, cardId: string, amount: number) {
		const card = await VirtualCardModel.findOne({
			cardId,
			user: ObjectId.createFromHexString(userId),
		});

		if (!card) {
			throw new NotFoundError("Virtual card not found");
		}

		const userWallet = await WalletModel.findOne({
			currency: card.currency,
			user: ObjectId.createFromHexString(userId),
		});

		if (!userWallet) {
			throw new NotFoundError(`User does not have a ${card.currency} wallet`);
		}

		if (userWallet.balance < amount) {
			throw new Error("Insufficient balance");
		}

		const status = await this.fundVirtualCardOnMaplerad(cardId, amount);

		if (status) {
			await userWallet.updateOne({
				balance: userWallet.balance - amount,
			});
		}

		return status;
	}

	async fundVirtualCardOnMaplerad(cardId: string, amount: number) {
		try {
			const options = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
				},
				url: `https://sandbox.api.maplerad.com/v1/issuing/${cardId}/fund`,
				data: {
					amount: amount * 100, // convert amount to lowest denomination
				},
			};

			const response = await axios(options);

			if (response.data.status) {
				return response.data.status;
			}

			throw new Error("Unable to fund virtual card on Maplerad");
		} catch (error: any) {
			console.error(
				"Error funding virtual card:",
				error.response?.data || error.message
			);
			throw error;
		}
	}
}

export default new VirtualCardService();