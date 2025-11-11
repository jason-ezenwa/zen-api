import WalletModel from '../models/wallet.model';
import UserModel from '../../users/models/user.model';
import { WalletService } from "./wallet.service";
import { NotFoundError } from "../../errors";
import DepositModel from "../models/deposit.model";
import { PaystackService } from "../../paystack/paystack.service";
import { TransactionStatus } from "../../../types";
import { ObjectId } from "mongodb";
import { createMock } from "@golevelup/ts-jest";

// Mock the logEvent function
jest.mock("../../../utils", () => ({
  logEvent: jest.fn(),
}));

describe("WalletService", () => {
  let service: WalletService;
  const paystackService = createMock<PaystackService>();

  beforeEach(() => {
    service = new WalletService(paystackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createWallet", () => {
    it("should create a wallet for a user", async () => {
      const userId = "user123";
      const currency = "USD";

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(user);

      const wallet = {
        user: user._id,
        currency,
      };

      jest.spyOn(WalletModel, "findOne").mockResolvedValueOnce(null);

      const walletCreateSpy = jest
        .spyOn(WalletModel, "create")
        .mockResolvedValueOnce(wallet as any);

      const createdWallet = await service.createWallet(userId, currency);

      expect(createdWallet).toEqual(wallet);

      expect(walletCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining(wallet)
      );
    });

    it("should throw an error if user is not found", async () => {
      const userId = "user123";
      const currency = "USD";

      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null);

      await expect(
        walletService.createWallet(userId, currency)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("fundWallet", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should create a deposit and return payment link", async () => {
      // Mock data
      const walletId = "wallet123";
      const userId = new ObjectId("507f1f77bcf86cd799439011");
      const amount = 5000;
      const depositFundsDto = { walletId, amount, currency: "NGN" };

      // Mock the wallet
      const wallet = {
        _id: new ObjectId("507f1f77bcf86cd799439012"),
        user: { _id: userId },
        currency: "NGN",
      };

      // Mock the user
      const user = {
        _id: userId,
        email: "test@example.com",
      };

      // Mock expected responses
      const mockPaymentLink = "https://paystack.com/payment/123456";
      const mockTotalAmount = 5100; // Amount with fees

      // Setup mocks
      jest.spyOn(WalletModel, "findOne").mockResolvedValueOnce(wallet as any);
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(user as any);
      jest.spyOn(DepositModel, "create").mockResolvedValueOnce({
        _id: new ObjectId("507f1f77bcf86cd799439013"),
        toHexString: () => "507f1f77bcf86cd799439013",
      } as any);

      // Mock PaystackService methods
      jest
        .spyOn(paystackService, "calculatePayableAmount")
        .mockReturnValue(mockTotalAmount);
      jest
        .spyOn(paystackService, "initializeTransaction")
        .mockResolvedValueOnce(mockPaymentLink);

      const result = await service.fundWallet(depositFundsDto);

      // Assertions
      expect(result).toEqual({
        paymentLink: mockPaymentLink,
        depositId: "507f1f77bcf86cd799439013",
      });

      expect(WalletModel.findOne).toHaveBeenCalledWith({
        _id: walletId,
        currency: "NGN",
      });

      expect(paystackService.calculatePayableAmount).toHaveBeenCalledWith(
        amount
      );
      expect(paystackService.initializeTransaction).toHaveBeenCalledWith(
        user.email,
        mockTotalAmount,
        expect.any(String)
      );

      expect(DepositModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: user._id,
          wallet: wallet._id,
          subTotal: amount,
          fee: mockTotalAmount - amount,
          total: mockTotalAmount,
          currency: "NGN",
          reference: expect.any(String),
          status: TransactionStatus.PENDING,
        })
      );
    });

    it("should throw NotFoundError if wallet is not found", async () => {
      const depositFundsDto = {
        walletId: "wallet123",
        amount: 5000,
        currency: "NGN",
      };

      jest.spyOn(WalletModel, "findOne").mockResolvedValueOnce(null);

      await expect(service.fundWallet(depositFundsDto)).rejects.toThrow(
        NotFoundError
      );

      expect(WalletModel.findOne).toHaveBeenCalled();
    });

    it("should throw NotFoundError if user is not found", async () => {
      const walletId = "wallet123";
      const userId = new ObjectId("507f1f77bcf86cd799439011");
      const depositFundsDto = { walletId, amount: 5000, currency: "NGN" };

      const wallet = {
        _id: new ObjectId("507f1f77bcf86cd799439012"),
        user: { _id: userId },
        currency: "NGN",
      };

      jest.spyOn(WalletModel, "findOne").mockResolvedValueOnce(wallet as any);
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null);

      await expect(service.fundWallet(depositFundsDto)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("creditWalletFollowingDeposit", () => {
    it("should credit wallet after successful deposit verification", async () => {
      // Mock data
      const transactionReference = "txnRef_123456789012";
      const walletId = new ObjectId("507f1f77bcf86cd799439012");
      const depositAmount = 5000;

      // Mock deposit
      const deposit = {
        _id: new ObjectId("507f1f77bcf86cd799439013"),
        wallet: walletId,
        reference: transactionReference,
        subTotal: depositAmount,
        status: TransactionStatus.PENDING,
        save: jest.fn().mockResolvedValueOnce(true),
        updateOne: jest.fn().mockResolvedValueOnce(true),
      };

      // Mock wallet
      const wallet = {
        _id: walletId,
        balance: 1000,
        save: jest.fn().mockResolvedValueOnce(true),
        updateOne: jest.fn().mockResolvedValueOnce(true),
      };

      // Setup mocks
      jest.spyOn(DepositModel, "findOne").mockResolvedValueOnce(deposit as any);
      jest.spyOn(WalletModel, "findById").mockResolvedValueOnce(wallet as any);
      jest
        .spyOn(paystackService, "verifyTransaction")
        .mockResolvedValueOnce(true);
      const result = await service.creditWalletFollowingDeposit(
        transactionReference
      );

      // Assertions
      expect(result).toBe(true);

      expect(DepositModel.findOne).toHaveBeenCalledWith({
        reference: transactionReference,
      });

      expect(paystackService.verifyTransaction).toHaveBeenCalledWith(
        transactionReference
      );
      expect(WalletModel.findById).toHaveBeenCalledWith(walletId);

      // Verify wallet was updated with new balance
      expect(wallet.updateOne).toHaveBeenCalledWith({
        $inc: { balance: depositAmount },
      });

      // Verify deposit status was updated
      expect(deposit.updateOne).toHaveBeenCalledWith({
        status: TransactionStatus.COMPLETED,
      });
    });

    it("should return true if deposit is already completed", async () => {
      const transactionReference = "txnRef_123456789012";

      const deposit = {
        status: TransactionStatus.COMPLETED,
      };

      jest.spyOn(DepositModel, "findOne").mockResolvedValueOnce(deposit as any);

      const result = await service.creditWalletFollowingDeposit(
        transactionReference
      );

      expect(result).toBe(true);
      expect(paystackService.verifyTransaction).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if deposit is not found", async () => {
      const transactionReference = "txnRef_123456789012";

      jest.spyOn(DepositModel, "findOne").mockResolvedValueOnce(null);

      await expect(
        service.creditWalletFollowingDeposit(transactionReference)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw error if transaction verification fails", async () => {
      const transactionReference = "txnRef_123456789012";

      const deposit = {
        reference: transactionReference,
        status: TransactionStatus.PENDING,
        save: jest.fn().mockResolvedValueOnce(true),
      };

      jest.spyOn(DepositModel, "findOne").mockResolvedValueOnce(deposit as any);
      jest
        .spyOn(paystackService, "verifyTransaction")
        .mockRejectedValueOnce(new Error("Transaction not verified"));

      await expect(
        service.creditWalletFollowingDeposit(transactionReference)
      ).rejects.toThrow("Transaction not verified");
    });

    it("should throw NotFoundError if wallet is not found", async () => {
      const transactionReference = "txnRef_123456789012";
      const walletId = new ObjectId("507f1f77bcf86cd799439012");

      const deposit = {
        wallet: walletId,
        reference: transactionReference,
        status: TransactionStatus.PENDING,
      };

      jest.spyOn(DepositModel, "findOne").mockResolvedValueOnce(deposit as any);
      jest.spyOn(WalletModel, "findById").mockResolvedValueOnce(null);

      await expect(
        service.creditWalletFollowingDeposit(transactionReference)
      ).rejects.toThrow(NotFoundError);
    });
  });
});