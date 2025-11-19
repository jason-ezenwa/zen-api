import axios from "axios";
import { NotFoundError } from "../errors";
import UserMapleRadAccountModel from "../users/models/user-maplerad-account.model";
import UserModel from "../users/models/user.model";
import VirtualCardRequestModel from "./models/virtual-card-request.model";
import VirtualCardService from "./virtual-cards.service";
import virtualCardsService from "./virtual-cards.service";
import VirtualCardModel from "./models/virtual-card.model";
import WalletModel from "../wallets/models/wallet.model";
import USDVirtualCardFeesModel from "../fees/models/usd-virtual-card-fees";
import { VirtualCardTransactionModel } from "./models/virtual-card-transaction";
import { ObjectId } from "mongodb";

jest.mock("axios");

describe("VirtualCardService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createVirtualCard", () => {
    it("should create a virtual card for a user", async () => {
      const userId = "user123";
      const currency = "USD";
      const brand = "Visa";
      const cardPin = "1234";

      const user = { _id: userId };

      jest.spyOn(UserModel, "findById").mockResolvedValue(user);

      const userMapleRadAccount = {
        userMapleRadAccountId: "account123",
        user: user._id,
      };

      jest
        .spyOn(UserMapleRadAccountModel, "findOne")
        .mockResolvedValue(userMapleRadAccount);

      jest.spyOn(WalletModel, "findOne").mockResolvedValue({
        balance: 200,
        currency: "USD",
        updateOne: jest.fn(),
      });

      jest.spyOn(USDVirtualCardFeesModel, "findOne").mockResolvedValue({
        name: "Card Creation Fee",
        fee: 4,
      });

      const cardRequest = {
        data: {
          reference: "card123",
        },
      };

      jest
        .spyOn(VirtualCardService, "createVirtualCardOnMaplerad")
        .mockResolvedValue(cardRequest as any);

      const createdCardRequest = await VirtualCardService.createVirtualCard(
        userId,
        currency,
        brand,
        cardPin
      );

      expect(createdCardRequest).toBeDefined();

      expect(
        virtualCardsService.createVirtualCardOnMaplerad
      ).toHaveBeenCalledWith(
        userMapleRadAccount.userMapleRadAccountId,
        currency,
        brand,
        cardPin
      );

      expect(
        virtualCardsService.createVirtualCardOnMaplerad
      ).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if user is not found", async () => {
      const userId = "user123";
      const currency = "USD";
      const brand = "Visa";
      const cardPin = "1234";

      jest.spyOn(UserModel, "findById").mockResolvedValue(null);

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw an error if user MapleRad account is not found", async () => {
      const userId = "user123";
      const currency = "USD";
      const brand = "Visa";
      const cardPin = "1234";

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, "findById").mockResolvedValue(user);
      jest.spyOn(UserMapleRadAccountModel, "findOne").mockResolvedValue(null);

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw an error if unable to create virtual card on Maplerad", async () => {
      const userId = "user123";
      const currency = "USD";
      const brand = "Visa";
      const cardPin = "1234";

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, "findById").mockResolvedValue(user);

      const userMapleRadAccount = {
        userMapleRadAccountId: "account123",
        user: user._id,
      };

      jest
        .spyOn(UserMapleRadAccountModel, "findOne")
        .mockResolvedValue(userMapleRadAccount);

      jest.spyOn(WalletModel, "findOne").mockResolvedValue({
        balance: 200,
        currency: "USD",
        updateOne: jest.fn(),
      });

      jest.spyOn(USDVirtualCardFeesModel, "findOne").mockResolvedValue({
        name: "Card Creation Fee",
        fee: 4,
      });

      jest
        .spyOn(VirtualCardService, "createVirtualCardOnMaplerad")
        .mockRejectedValue(new Error());

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(Error);
    });

    it("should throw an error if the user has insufficient balance", async () => {
      const userId = "user123";
      const currency = "USD";
      const brand = "Visa";
      const cardPin = "1234";

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, "findById").mockResolvedValue(user);

      const userMapleRadAccount = {
        userMapleRadAccountId: "account123",
        user: user._id,
      };

      jest
        .spyOn(UserMapleRadAccountModel, "findOne")
        .mockResolvedValue(userMapleRadAccount);

      jest.spyOn(WalletModel, "findOne").mockResolvedValue({
        balance: 3,
        currency: "USD",
        updateOne: jest.fn(),
      });

      jest.spyOn(USDVirtualCardFeesModel, "findOne").mockResolvedValue({
        name: "Card Creation Fee",
        fee: 4,
      });

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(Error);
    });
  });

  describe("fundVirtualCard", () => {
    it("should fund a virtual card for a user", async () => {
      const userId = "66a68f1e8de00f8e8c629687";
      const cardId = "card123";
      const amount = 100;

      const user = {
        _id: ObjectId.createFromHexString(userId),
      };

      const card = {
        _id: ObjectId.createFromHexString("66a68f1e8de00f8e8c629687"),
        cardId,
        currency: "USD",
        balance: 0,
      };

      const userWallet = {
        balance: 200,
        currency: "USD",
        updateOne: jest.fn(),
      };

      const transaction = {
        card: card._id,
        user: user._id,
        amount,
        currency: "USD",
        description: "Top up",
        status: "completed",
      };

      jest.spyOn(UserModel, "findById").mockResolvedValue(user);
      jest.spyOn(VirtualCardModel, "findOne").mockResolvedValue(card);
      jest.spyOn(WalletModel, "findOne").mockResolvedValue(userWallet);
      jest
        .spyOn(VirtualCardService, "fundVirtualCardOnMaplerad")
        .mockResolvedValue(true);

      jest.spyOn(VirtualCardModel, "findByIdAndUpdate").mockResolvedValue({});

      jest
        .spyOn(VirtualCardTransactionModel, "create")
        .mockResolvedValue(transaction as any);

      const status = await VirtualCardService.fundVirtualCard(
        userId,
        cardId,
        amount
      );

      expect(status).toBe(true);

      // verify wallet balance was decremented
      expect(userWallet.updateOne).toHaveBeenCalledWith({
        $inc: { balance: -amount },
      });

      // verify card balance was incremented
      expect(VirtualCardModel.findByIdAndUpdate).toHaveBeenCalledWith(
        card._id,
        {
          $inc: { balance: amount },
        }
      );

      // verify transaction was created
      expect(VirtualCardTransactionModel.create).toHaveBeenCalledWith(
        transaction
      );
    });

    it("should throw an error if virtual card is not found", async () => {
      const userId = "66a68f1e8de00f8e8c629687";
      const cardId = "card123";
      const amount = 100;

      jest.spyOn(VirtualCardModel, "findOne").mockResolvedValue(null);

      await expect(
        VirtualCardService.fundVirtualCard(userId, cardId, amount)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw an error if user wallet is not found", async () => {
      const userId = "66a68f1e8de00f8e8c629687";
      const cardId = "card123";
      const amount = 100;

      const card = {
        cardId,
        currency: "USD",
      };

      jest.spyOn(VirtualCardModel, "findOne").mockResolvedValue(card);
      jest.spyOn(WalletModel, "findOne").mockResolvedValue(null);

      await expect(
        VirtualCardService.fundVirtualCard(userId, cardId, amount)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw an error if user has insufficient balance", async () => {
      const userId = "66a68f1e8de00f8e8c629687";
      const cardId = "card123";
      const amount = 100;

      const card = {
        cardId,
        currency: "USD",
      };

      const userWallet = {
        balance: 3,
        currency: "USD",
        updateOne: jest.fn(),
      };

      jest.spyOn(VirtualCardModel, "findOne").mockResolvedValue(card);
      jest.spyOn(WalletModel, "findOne").mockResolvedValue(userWallet);

      await expect(
        VirtualCardService.fundVirtualCard(userId, cardId, amount)
      ).rejects.toThrow(Error);
    });
  });
});
