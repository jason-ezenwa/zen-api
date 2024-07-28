import axios from 'axios';
import { NotFoundError } from '../../errors';
import UserMapleRadAccountModel from '../../users/models/user-maplerad-account.model';
import UserModel from '../../users/models/user.model';
import VirtualCardRequestModel from '../models/virtual-card-request.model';
import VirtualCardService from './virtual-cards.service';
import virtualCardsService from './virtual-cards.service';

jest.mock('axios');

describe('VirtualCardService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVirtualCard', () => {
    it('should create a virtual card for a user', async () => {
      const userId = 'user123';
      const currency = 'USD';
      const brand = 'Visa';
      const cardPin = '1234';

      const user = { _id: userId };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(user);

      const userMapleRadAccount = {
        userMapleRadAccountId: 'account123',
        user: user._id,
      };

      jest.spyOn(UserMapleRadAccountModel, 'findOne').mockResolvedValue(userMapleRadAccount);

      const cardRequest = {
        data: {
          reference: 'card123',
        },
      };

      jest.spyOn(VirtualCardService, 'createVirtualCardOnMaplerad').mockResolvedValue(cardRequest as any);

      const createdCardRequest = await VirtualCardService.createVirtualCard(
        userId,
        currency,
        brand,
        cardPin
      );

      expect(createdCardRequest).toBeDefined();

      expect(virtualCardsService.createVirtualCardOnMaplerad).toHaveBeenCalledWith(
        userMapleRadAccount.userMapleRadAccountId,
        currency,
        brand,
        cardPin
      );

      expect(virtualCardsService.createVirtualCardOnMaplerad).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if user is not found', async () => {
      const userId = 'user123';
      const currency = 'USD';
      const brand = 'Visa';
      const cardPin = '1234';

      jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw an error if user MapleRad account is not found', async () => {
      const userId = 'user123';
      const currency = 'USD';
      const brand = 'Visa';
      const cardPin = '1234';

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(user);
      jest.spyOn(UserMapleRadAccountModel, 'findOne').mockResolvedValue(null);

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw an error if unable to create virtual card on Maplerad', async () => {
      const userId = 'user123';
      const currency = 'USD';
      const brand = 'Visa';
      const cardPin = '1234';

      const user = {
        _id: userId,
      };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(user);

      const userMapleRadAccount = {
        userMapleRadAccountId: 'account123',
      };

      jest.spyOn(UserMapleRadAccountModel, 'findOne').mockResolvedValue(userMapleRadAccount);

      jest.spyOn(VirtualCardService, 'createVirtualCardOnMaplerad').mockRejectedValue(new Error());

      await expect(
        VirtualCardService.createVirtualCard(userId, currency, brand, cardPin)
      ).rejects.toThrow(Error);
    });
  });
});