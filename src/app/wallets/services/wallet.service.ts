import WalletModel from '../models/wallet.model'; // Adjust the path if necessary
import UserModel  from '../../users/models/user.model'; // Adjust the path if necessary
import { BadRequestError, NotFoundError } from '../../errors';
import { ObjectId } from 'mongodb';

class WalletService {
  async createWallet(userId: string, currency: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const allowedCurrencies = ['USD', 'NGN', 'GHS', 'KES'];

    const existingCurrencyWallet = await WalletModel.findOne({ user: user._id, currency });

    if (existingCurrencyWallet) {
      throw new BadRequestError('Wallet already exists for specified currency');
    }

    if (!allowedCurrencies.includes(currency)) {
      throw new BadRequestError('Currency not supported');
    }

    const wallet = new WalletModel({ user: user._id, currency });

    const createdWallet = await WalletModel.create(wallet);

    return createdWallet;
  }

  async createDefaultWallets(userId: string) { 
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const defaultCurrencies = ['USD', 'NGN'];

    const wallets = defaultCurrencies.map(currency => {
      return new WalletModel({ user: user._id, currency });
    });

    const createdDefaultWallets = await WalletModel.insertMany(wallets);

    return createdDefaultWallets;
  }

  async getWalletsByUserId(userId: string) {
    const wallet = WalletModel.find({ user: ObjectId.createFromHexString(userId) }).populate('user');
    if (!wallet) {
      throw new NotFoundError('Wallets not found');
    }

    return wallet;
  }

  async getWalletByWalletId(walletId: string) {
    const wallet = WalletModel.findById(walletId).populate('user');
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return wallet;
  }
}

export default new WalletService();
