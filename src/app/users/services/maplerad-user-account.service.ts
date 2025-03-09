import axios from "axios";
import { NotFoundError } from "../../errors";
import UserModel from "../models/user.model";
import UserMapleRadAccountModel from "../models/user-maplerad-account.model";

const formatDob = (date: Date) => {
  const day = date.getDate();

  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

class MapleradUserAccountService {
  async createUserAccountOnMaplerad(userId: string) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      dateOfBirth,
      bvn
    } = user;


    const dob = formatDob(dateOfBirth);

    const mapleradOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAPLERAD_SECRET_KEY}`,
      },
      url: 'https://sandbox.api.maplerad.com/v1/customers/enroll',
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        country: "NG",
        dob,
        phone: {
          phone_country_code: "+234",
          phone_number: phoneNumber.split('+234')[1],
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          country: "NG",
          postal_code: address.zipCode,
        },
        identification_number: bvn,
      },
    };

    try {
      const mapleradResponse = await axios(mapleradOptions);
      const userMapleRadAccountId = mapleradResponse.data.data.id;
      const tier = mapleradResponse.data.data.tier;

      await UserMapleRadAccountModel.create({
        user: user._id,
        userMapleRadAccountId,
        tier,
      });

      return true;
    } catch (error: any) {
      console.error('Error creating user account on Maplerad:', error.response?.data || error.message);
      throw new Error('Error creating user account on Maplerad');
    }
  };
}

export default new MapleradUserAccountService();