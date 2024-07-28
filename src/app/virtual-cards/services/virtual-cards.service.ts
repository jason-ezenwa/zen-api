import axios from "axios";
import { NotFoundError } from "../../errors";
import UserMapleRadAccountModel from "../../users/models/user-maplerad-account.model";
import UserModel from "../../users/models/user.model";
import VirtualCardRequestModel from "../models/virtual-card-request.model";

class VirtualCardService {
  async createVirtualCard(
    userId: string,
    currency: string,
    brand: string,
    cardPin: string
  ) {
    const user = await UserModel.findById(userId)

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userMapleRadAccount = await UserMapleRadAccountModel.findOne({ user: user._id });

    if (!userMapleRadAccount) {
      throw new NotFoundError('User MapleRad account not found');
    }

    const cardRequest = await this.createVirtualCardOnMaplerad(
      userMapleRadAccount.userMapleRadAccountId,
      currency,
      brand,
      cardPin
    );

    return cardRequest;
  }

  async createVirtualCardOnMaplerad(userMapleRadAccountId: string, currency: string, brand: string, cardPin: string) {
    try {
      const userMapleRadAccount = await UserMapleRadAccountModel.findOne({ userMapleRadAccountId });

      if (!userMapleRadAccount) {
        throw new NotFoundError('User MapleRad account not found');
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MAPLERAD_SECRET_KEY}`
        },
        url: 'https://sandbox.api.maplerad.com/v1/issuing',
      }

      const response = await axios.post(options.url, {
        customer_id: userMapleRadAccountId,
        currency,
        brand,
        card_pin: cardPin,
        type: 'VIRTUAL',
        auto_approve: true
      }, {
        headers: options.headers
      });


      if (response.data.data) {
        const createdCardRequest = await VirtualCardRequestModel.create({
          user: userMapleRadAccount?.user,
          cardReference: response.data.data.reference,
        });

        return createdCardRequest;
      }

      throw new Error('Unable to create virtual card on Maplerad');
    } catch (error: any) {
      console.error('Error creating virtual card:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new VirtualCardService();