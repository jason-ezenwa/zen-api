import { NotFoundError } from "../errors";
import redisClient from "../redisClient";
import WalletModel from "../wallets/models/wallet.model";
import UserModel from "../users/models/user.model";
import MarginModel from "../margins/models/margin";
import CurrencyExchangeModel from "./models/currency-exchange";
import { CurrencyExchange } from "./models/currency-exchange";
import { TransactionStatus } from "../../types";
import CurrencyExchangeService from "./currency-exchange.service";
import { ObjectId } from "mongodb";

// Mock the logEvent function
jest.mock("../../utils", () => ({
  logEvent: jest.fn(),
}));

// Mock Redis client
jest.mock("../redisClient", () => ({
  __esModule: true,
  default: Promise.resolve({
    set: jest.fn(),
    get: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  }),
}));

describe("CurrencyExchangeService", () => {
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = await redisClient;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrencyExchangeMarginFromDb", () => {
    it("should return currency exchange margin from database", async () => {
      const mockMargin = {
        _id: "margin123",
        margin: 0.02,
        name: "FX Margin",
      };

      jest.spyOn(MarginModel, "findOne").mockResolvedValueOnce(mockMargin as any);

      const result = await CurrencyExchangeService.getCurrencyExchangeMarginFromDb();

      expect(result).toEqual(mockMargin);
      expect(MarginModel.findOne).toHaveBeenCalledTimes(1);
    });

    it("should return null if no margin is found", async () => {
      jest.spyOn(MarginModel, "findOne").mockResolvedValueOnce(null);

      const result = await CurrencyExchangeService.getCurrencyExchangeMarginFromDb();

      expect(result).toBeNull();
      expect(MarginModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateFXQuote", () => {
    it("should generate FX quote and store in Redis", async () => {
      const quoteDto = {
        sourceCurrency: "USD",
        targetCurrency: "NGN",
        amount: 100,
      };

      const mockQuoteResponse = {
        sourceAmount: 100,
        targetAmount: 75000,
        exchangeRate: 750,
        quoteReference: "quote123",
      };

      // Mock the generateFXQuoteFromMaplerad method
      jest
        .spyOn(CurrencyExchangeService, "generateFXQuoteFromMaplerad")
        .mockResolvedValueOnce(mockQuoteResponse);

      const result = await CurrencyExchangeService.generateFXQuote(quoteDto);

      expect(result).toEqual({
        message: "FX quote generated successfully",
        quoteReference: "quote123",
        sourceAmount: 100,
        targetAmount: 75000,
        exchangeRate: 750,
      });

      // Verify Redis operations
      expect(mockRedis.set).toHaveBeenCalledWith(
        "fx_quote123",
        JSON.stringify({
          sourceAmount: 100,
          sourceCurrency: "USD",
          targetAmount: 75000,
          targetCurrency: "NGN",
          reference: "quote123",
          exchangeRate: 750,
        })
      );
      expect(mockRedis.expire).toHaveBeenCalledWith("fx_quote123", 180);
    });
  });

  describe("exchangeCurrency", () => {
    const userId = "66a68f1e8de00f8e8c629687";
    const quoteReference = "quote123";
    const fxQuoteKey = "fx_quote123";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully exchange currency", async () => {
      const mockFxQuote = JSON.stringify({
        sourceAmount: 100,
        targetAmount: 75000,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
      });

      const mockUser = {
        _id: new ObjectId(userId),
        email: "test@example.com",
      };

      const mockSourceWallet = {
        _id: new ObjectId("66a68f1e8de00f8e8c629688"),
        currency: "USD",
        balance: 200,
        user: mockUser._id,
        updateOne: jest.fn().mockResolvedValueOnce(true),
      };

      const mockTargetWallet = {
        _id: new ObjectId("66a68f1e8de00f8e8c629689"),
        currency: "NGN",
        balance: 0,
        user: mockUser._id,
        updateOne: jest.fn().mockResolvedValueOnce(true),
      };

      const mockCreatedTransaction = {
        _id: new ObjectId("66a68f1e8de00f8e8c629690"),
        user: mockUser._id,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
        sourceAmount: 100,
        targetAmount: 75000,
        status: TransactionStatus.COMPLETED,
        reference: fxQuoteKey,
      };

      // Setup mocks
      mockRedis.get.mockResolvedValueOnce(mockFxQuote);
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser as any);
      jest.spyOn(WalletModel, "findOne")
        .mockResolvedValueOnce(mockSourceWallet as any) // Source wallet
        .mockResolvedValueOnce(mockTargetWallet as any); // Target wallet
      
      jest
        .spyOn(CurrencyExchangeService, "exchangeCurrencyOnMaplerad")
        .mockResolvedValueOnce({ status: true });
      
      jest
        .spyOn(CurrencyExchangeModel, "create")
        .mockResolvedValueOnce(mockCreatedTransaction as any);

      const result = await CurrencyExchangeService.exchangeCurrency(
        userId,
        quoteReference
      );

      // Assertions
      expect(result).toEqual(mockCreatedTransaction);
      expect(mockRedis.get).toHaveBeenCalledWith(fxQuoteKey);
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      
      // Verify wallet queries
      expect(WalletModel.findOne).toHaveBeenCalledWith({
        currency: "USD",
        user: mockUser._id,
      });
      expect(WalletModel.findOne).toHaveBeenCalledWith({
        currency: "NGN",
        user: mockUser._id,
      });

      // Verify wallet balance updates
      expect(mockSourceWallet.updateOne).toHaveBeenCalledWith({
        $inc: { balance: -100 },
      });
      expect(mockTargetWallet.updateOne).toHaveBeenCalledWith({
        $inc: { balance: 75000 },
      });

      // Verify transaction creation
      expect(CurrencyExchangeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser._id,
          sourceCurrency: "USD",
          targetCurrency: "NGN",
          sourceAmount: 100,
          targetAmount: 75000,
          status: TransactionStatus.COMPLETED,
          reference: fxQuoteKey,
        })
      );

      // Verify Redis cleanup
      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });

    it("should throw NotFoundError if FX quote is not found", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await expect(
        CurrencyExchangeService.exchangeCurrency(userId, quoteReference)
      ).rejects.toThrow(NotFoundError);

      expect(mockRedis.get).toHaveBeenCalledWith(fxQuoteKey);
      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });

    it("should throw NotFoundError if user is not found", async () => {
      const mockFxQuote = JSON.stringify({
        sourceAmount: 100,
        targetAmount: 75000,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
      });

      mockRedis.get.mockResolvedValueOnce(mockFxQuote);
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null);

      await expect(
        CurrencyExchangeService.exchangeCurrency(userId, quoteReference)
      ).rejects.toThrow(NotFoundError);

      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });

    it("should throw NotFoundError if source currency wallet is not found", async () => {
      const mockFxQuote = JSON.stringify({
        sourceAmount: 100,
        targetAmount: 75000,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
      });

      const mockUser = {
        _id: new ObjectId(userId),
        email: "test@example.com",
      };

      mockRedis.get.mockResolvedValue(mockFxQuote);
      mockRedis.del.mockResolvedValueOnce(1);
      jest.spyOn(UserModel, "findById").mockResolvedValue(mockUser as any);
      jest.spyOn(WalletModel, "findOne").mockResolvedValue(null);

      try {
        await CurrencyExchangeService.exchangeCurrency(userId, quoteReference);
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toContain("User does not have a USD wallet");
      }

      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });

    it("should throw NotFoundError if target currency wallet is not found", async () => {
      const mockFxQuote = JSON.stringify({
        sourceAmount: 100,
        targetAmount: 75000,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
      });

      const mockUser = {
        _id: new ObjectId(userId),
        email: "test@example.com",
      };

      const mockSourceWallet = {
        _id: new ObjectId("66a68f1e8de00f8e8c629688"),
        currency: "USD",
        balance: 200,
        user: mockUser._id,
      };

      mockRedis.get.mockResolvedValueOnce(mockFxQuote);
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser as any);
      jest.spyOn(WalletModel, "findOne")
        .mockResolvedValueOnce(mockSourceWallet as any) // Source wallet
        .mockResolvedValueOnce(null); // Target wallet not found

      await expect(
        CurrencyExchangeService.exchangeCurrency(userId, quoteReference)
      ).rejects.toThrow(NotFoundError);

      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });

    it("should throw error if user has insufficient balance", async () => {
      const mockFxQuote = JSON.stringify({
        sourceAmount: 100,
        targetAmount: 75000,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
      });

      const mockUser = {
        _id: new ObjectId(userId),
        email: "test@example.com",
      };

      const mockSourceWallet = {
        _id: new ObjectId("66a68f1e8de00f8e8c629688"),
        currency: "USD",
        balance: 50, // Insufficient balance
        user: mockUser._id,
      };

      const mockTargetWallet = {
        _id: new ObjectId("66a68f1e8de00f8e8c629689"),
        currency: "NGN",
        balance: 0,
        user: mockUser._id,
      };

      mockRedis.get.mockResolvedValueOnce(mockFxQuote);
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser as any);
      jest.spyOn(WalletModel, "findOne")
        .mockResolvedValueOnce(mockSourceWallet as any)
        .mockResolvedValueOnce(mockTargetWallet as any);

      await expect(
        CurrencyExchangeService.exchangeCurrency(userId, quoteReference)
      ).rejects.toThrow("Insufficient balance");

      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });

    it("should clean up Redis quote on error", async () => {
      const mockFxQuote = JSON.stringify({
        sourceAmount: 100,
        targetAmount: 75000,
        sourceCurrency: "USD",
        targetCurrency: "NGN",
      });

      mockRedis.get.mockResolvedValueOnce(mockFxQuote);
      jest.spyOn(UserModel, "findById").mockRejectedValueOnce(new Error("Database error"));

      await expect(
        CurrencyExchangeService.exchangeCurrency(userId, quoteReference)
      ).rejects.toThrow("Database error");

      expect(mockRedis.del).toHaveBeenCalledWith(fxQuoteKey);
    });
  });

  describe("getUserFXTransactions", () => {
    it("should return user FX transactions with pagination", async () => {
      const getUserRecordsDto = {
        userId: "66a68f1e8de00f8e8c629687",
        page: 1,
      };

      const mockUser = {
        _id: new ObjectId(getUserRecordsDto.userId),
        email: "test@example.com",
      };

      const mockTransactions = [
        {
          _id: new ObjectId("66a68f1e8de00f8e8c629690"),
          user: mockUser._id,
          sourceCurrency: "USD",
          targetCurrency: "NGN",
          sourceAmount: 100,
          targetAmount: 75000,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(),
        },
        {
          _id: new ObjectId("66a68f1e8de00f8e8c629691"),
          user: mockUser._id,
          sourceCurrency: "NGN",
          targetCurrency: "USD",
          sourceAmount: 75000,
          targetAmount: 100,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(),
        },
      ];

      const totalRecords = 15;
      const numberOfRecordsPerPage = 10;
      const totalPages = Math.ceil(totalRecords / numberOfRecordsPerPage);

      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser as any);
      jest.spyOn(CurrencyExchangeModel, "find").mockResolvedValueOnce(mockTransactions as any);
      jest.spyOn(CurrencyExchangeModel, "countDocuments").mockResolvedValueOnce(totalRecords);

      const result = await CurrencyExchangeService.getUserFXTransactions(getUserRecordsDto);

      expect(result).toEqual({
        fxTransactions: mockTransactions,
        totalPages,
        page: 1,
        totalRecords,
        numberOfRecordsPerPage,
      });

      expect(UserModel.findById).toHaveBeenCalledWith(getUserRecordsDto.userId);
      expect(CurrencyExchangeModel.find).toHaveBeenCalledWith(
        { user: mockUser._id },
        null,
        {
          skip: 0,
          limit: 10,
          sort: { createdAt: -1 },
        }
      );
      expect(CurrencyExchangeModel.countDocuments).toHaveBeenCalledWith({
        user: mockUser._id,
      });
    });

    it("should handle pagination correctly for page 2", async () => {
      const getUserRecordsDto = {
        userId: "66a68f1e8de00f8e8c629687",
        page: 2,
      };

      const mockUser = {
        _id: new ObjectId(getUserRecordsDto.userId),
        email: "test@example.com",
      };

      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser as any);
      jest.spyOn(CurrencyExchangeModel, "find").mockResolvedValueOnce([]);
      jest.spyOn(CurrencyExchangeModel, "countDocuments").mockResolvedValueOnce(15);

      await CurrencyExchangeService.getUserFXTransactions(getUserRecordsDto);

      expect(CurrencyExchangeModel.find).toHaveBeenCalledWith(
        { user: mockUser._id },
        null,
        {
          skip: 10, // (page - 1) * numberOfRecordsPerPage = (2 - 1) * 10
          limit: 10,
          sort: { createdAt: -1 },
        }
      );
    });

    it("should default to page 1 if page is not provided", async () => {
      const getUserRecordsDto = {
        userId: "66a68f1e8de00f8e8c629687",
      };

      const mockUser = {
        _id: new ObjectId(getUserRecordsDto.userId),
        email: "test@example.com",
      };

      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser as any);
      jest.spyOn(CurrencyExchangeModel, "find").mockResolvedValueOnce([]);
      jest.spyOn(CurrencyExchangeModel, "countDocuments").mockResolvedValueOnce(0);

      const result = await CurrencyExchangeService.getUserFXTransactions(getUserRecordsDto);

      expect(result.page).toBe(1);
      expect(CurrencyExchangeModel.find).toHaveBeenCalledWith(
        { user: mockUser._id },
        null,
        {
          skip: 0,
          limit: 10,
          sort: { createdAt: -1 },
        }
      );
    });

    it("should throw NotFoundError if user is not found", async () => {
      const getUserRecordsDto = {
        userId: "66a68f1e8de00f8e8c629687",
        page: 1,
      };

      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null);

      await expect(
        CurrencyExchangeService.getUserFXTransactions(getUserRecordsDto)
      ).rejects.toThrow(NotFoundError);

      expect(UserModel.findById).toHaveBeenCalledWith(getUserRecordsDto.userId);
    });

    it("should handle errors and log them", async () => {
      const getUserRecordsDto = {
        userId: "66a68f1e8de00f8e8c629687",
        page: 1,
      };

      const error = new Error("Database connection error");
      jest.spyOn(UserModel, "findById").mockRejectedValueOnce(error);

      await expect(
        CurrencyExchangeService.getUserFXTransactions(getUserRecordsDto)
      ).rejects.toThrow(error);

      // The logEvent function should be called for error logging
      const { logEvent } = require("../../utils");
      expect(logEvent).toHaveBeenCalledWith("error", "Error getting user fx transactions", {
        error,
      });
    });
  });
});
