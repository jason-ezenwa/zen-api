import axios from "axios";
import { BadRequestError, NotFoundError } from "../../errors";
import UserMapleRadAccountModel from "../../users/models/user-maplerad-account.model";
import UserModel from "../../users/models/user.model";
import VirtualCardRequestModel from "../models/virtual-card-request.model";
import WalletModel from "../../wallets/models/wallet.model";
import USDVirtualCardFeesModel from "../../fees/models/usd-virtual-card-fees";
import VirtualCardModel, { VirtualCard } from "../models/virtual-card.model";
import { ObjectId } from "mongodb";
import { logEvent } from "../../../utils";
import {
  VirtualCardTransaction,
  VirtualCardTransactionModel,
} from "../models/virtual-card-transaction";
import { GetUserRecordsDto } from "../../common/dtos";
import { TransactionStatus } from "../../../types";

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
          $inc: { balance: -cardCreationFee.fee },
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

      return virtualCard;
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

  async handleVirtualCardCreation(cardReference: string) {
    try {
      logEvent("info", "Handling virtual card creation", {
        cardReference,
      });

      const virtualCardRequest = await VirtualCardRequestModel.findOne({
        cardReference,
      });

      if (!virtualCardRequest) {
        throw new Error("Virtual card request not found");
      }

      const cardDetails = await this.getVirtualCardDetailsFromMaplerad(
        cardReference
      );

      await VirtualCardRequestModel.updateOne(
        { cardReference },
        { status: "SUCCESS" }
      );

      const {
        id,
        name,
        masked_pan,
        card_number,
        expiry,
        cvv,
        type,
        issuer,
        currency,
        status,
      } = cardDetails;

      const existingVirtualCard = await VirtualCardModel.findOne({
        cardReference,
      });

      if (existingVirtualCard) {
        logEvent("error", "Virtual card already exists", {
          cardReference,
        });

        return true;
      }

      const virtualCard = new VirtualCard();

      virtualCard.user = virtualCardRequest.user;
      virtualCard.cardReference = cardReference;
      virtualCard.cardId = id;
      virtualCard.name = name;
      virtualCard.maskedPan = masked_pan;
      virtualCard.number = card_number;
      virtualCard.expiry = expiry;
      virtualCard.cvv = cvv;
      virtualCard.type = type;
      virtualCard.issuer = issuer;
      virtualCard.currency = currency;
      virtualCard.status = status;

      const createdVirtualCard = await VirtualCardModel.create(virtualCard);

      logEvent("info", "Virtual card created successfully", {
        cardReference,
        virtualCardId: createdVirtualCard._id,
      });

      return createdVirtualCard;
    } catch (error: any) {
      logEvent("error", "Error handling virtual card creation", { error });
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
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError("User not found");
      }

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
        throw new BadRequestError("Insufficient balance");
      }

      const status = await this.fundVirtualCardOnMaplerad(cardId, amount);

      if (status) {
        await userWallet.updateOne({
          $inc: { balance: -amount },
        });

        await VirtualCardModel.findByIdAndUpdate(card._id, {
          $inc: { balance: amount },
        });

        const transaction = new VirtualCardTransaction();

        transaction.card = card._id;
        transaction.user = user._id;
        transaction.amount = amount;
        transaction.currency = card.currency;
        transaction.description = "Top up";
        transaction.status = TransactionStatus.COMPLETED;

        await VirtualCardTransactionModel.create(transaction);
      }

      return status;
    } catch (error) {
      logEvent("error", "Error funding virtual card", { error });

      throw error;
    }
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

  async getVirtualCardTransactions(getUserRecordsDto: GetUserRecordsDto) {
    try {
      const { userId, page = 1 } = getUserRecordsDto;

      const numberOfRecordsPerPage = 10;

      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const cardTransactions = await VirtualCardTransactionModel.find(
        { user: user._id },
        null,
        {
          skip: (page - 1) * numberOfRecordsPerPage,
          limit: numberOfRecordsPerPage,
          sort: { createdAt: -1 },
        }
      );

      const totalRecords = await VirtualCardTransactionModel.countDocuments({
        user: user._id,
      });

      const totalPages = Math.ceil(totalRecords / numberOfRecordsPerPage);

      return {
        cardTransactions,
        totalPages,
        page,
        totalRecords,
        numberOfRecordsPerPage,
      };
    } catch (error) {
      logEvent("error", "Error fetching virtual card transactions", { error });

      throw error;
    }
  }
}

export default new VirtualCardService();