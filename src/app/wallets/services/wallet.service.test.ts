import WalletModel from '../models/wallet.model';
import UserModel from '../../users/models/user.model';
import WalletService from './wallet.service';
import { NotFoundError } from '../../errors';

describe('WalletService', () => {
  describe('createWallet', () => {
    it('should create a wallet for a user', async () => {
      const userId = 'user123';
      const currency = 'USD';

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(user);

      const wallet = {
        user: user._id,
        currency,
      };

      jest.spyOn(WalletModel, 'findOne').mockResolvedValue(null);

      const walletCreateSpy = jest.spyOn(WalletModel, 'create').mockResolvedValue({} as any);

      const createdWallet = await WalletService.createWallet(userId, currency);

      expect(createdWallet).toBeDefined();

      expect(walletCreateSpy).toHaveBeenCalledWith(expect.objectContaining(wallet));
    });

    it('should throw an error if user is not found', async () => {
      const userId = 'user123';
      const currency = 'USD';

      jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

      await expect(WalletService.createWallet(userId, currency)).rejects.toThrow(NotFoundError);
    });
  });
});