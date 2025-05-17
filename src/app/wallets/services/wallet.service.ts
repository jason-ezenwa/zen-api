import WalletModel from '../models/wallet.model'; // Adjust the path if necessary
import UserModel  from '../../users/models/user.model'; // Adjust the path if necessary
import { BadRequestError, NotFoundError } from '../../errors';
import { ObjectId } from 'mongodb';
import { DepositFundsDto } from "../dto/deposit-funds.dto";
import { PaystackService } from "../../paystack/paystack.service";
import { randomUUID } from "crypto";
import DepositModel from "../models/deposit.model";
import { logEvent } from "../../../utils";
import { TransactionStatus } from "../../../types";
export class WalletService {
  constructor(private readonly paystackService: PaystackService) {}
  async createWallet(userId: string, currency: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const allowedCurrencies = ["USD", "NGN", "GHS", "KES"];

    const existingCurrencyWallet = await WalletModel.findOne({
      user: user._id,
      currency,
    });

    if (existingCurrencyWallet) {
      throw new BadRequestError("Wallet already exists for specified currency");
    }

    if (!allowedCurrencies.includes(currency)) {
      throw new BadRequestError("Currency not supported");
    }

    const wallet = new WalletModel({ user: user._id, currency });

    const createdWallet = await WalletModel.create(wallet);

    return createdWallet;
  }

  async createDefaultWallets(userId: string) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const defaultCurrencies = ["USD", "NGN"];

    const wallets = defaultCurrencies.map((currency) => {
      return new WalletModel({ user: user._id, currency });
    });

    const createdDefaultWallets = await WalletModel.insertMany(wallets);

    return createdDefaultWallets;
  }

  async getWalletsByUserId(userId: string) {
    const wallet = await WalletModel.find({
      user: ObjectId.createFromHexString(userId),
    }).populate("user");
    if (!wallet) {
      throw new NotFoundError("Wallets not found");
    }

    return wallet;
  }

  async getWalletByWalletId(walletId: string) {
    const wallet = await WalletModel.findById(walletId).populate("user");

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    return wallet;
  }

  async fundWallet(depositFundsDto: DepositFundsDto) {
    try {
      const wallet = await WalletModel.findOne({
        _id: depositFundsDto.walletId,
        currency: "NGN",
      });

      if (!wallet) {
        throw new NotFoundError("NGN wallet not found");
      }

      const user = await UserModel.findById(wallet.user._id);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const transactionReference =
        "txnRef_" + randomUUID().replace(/-/g, "").slice(0, 12);

      const totalAmount = this.paystackService.calculatePayableAmount(
        depositFundsDto.amount
      );

      const paymentLink = await this.paystackService.initializeTransaction(
        user.email,
        totalAmount,
        transactionReference
      );

      const deposit = new DepositModel();

      deposit.user = user._id;
      deposit.wallet = wallet._id;
      deposit.subTotal = depositFundsDto.amount;
      deposit.fee = totalAmount - depositFundsDto.amount;
      deposit.total = totalAmount;
      deposit.currency = "NGN";
      deposit.reference = transactionReference;
      deposit.status = TransactionStatus.PENDING;

      const createdDeposit = await DepositModel.create(deposit);

      return {
        paymentLink,
        depositId: createdDeposit._id.toHexString(),
      };
    } catch (error) {
      logEvent("error", "Error funding wallet", {
        error,
      });

      throw error;
    }
  }

  async creditWalletFollowingDeposit(transactionReference: string) {
    try {
      logEvent("info", "Credit wallet following deposit", {
        transactionReference,
      });

      const deposit = await DepositModel.findOne({
        reference: transactionReference,
      });

      if (!deposit) {
        throw new NotFoundError("Deposit not found");
      }

      if (deposit.status === TransactionStatus.COMPLETED) {
        return true;
      }

      const isVerified = await this.paystackService.verifyTransaction(
        deposit.reference
      );

      if (!isVerified) {
        throw new Error("Transaction not verified");
      }

      const wallet = await WalletModel.findById(deposit.wallet);

      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      wallet.balance += deposit.subTotal;

      await wallet.save();

      deposit.status = TransactionStatus.COMPLETED;

      await deposit.save();

      logEvent("info", "Wallet credited successfully", {
        reference: transactionReference,
      });

      return true;
    } catch (error) {
      logEvent("error", "Error crediting wallet", {
        error,
      });

      throw error;
    }
  }
}

export default new WalletService(new PaystackService());
