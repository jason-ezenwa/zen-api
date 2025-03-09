import UserModel from '../../users/models/user.model';
import mapleradUserAccountService from '../../users/services/maplerad-user-account.service';
import walletService from '../../wallets/services/wallet.service';
import { generateToken } from '../utils/jwt.util';

interface RegisterInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string;
  password: string;
  bvn: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

interface LoginInput {
  email: string;
  password: string;
}

class AuthService {
  public async register(input: RegisterInput) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        address,
        dateOfBirth,
        bvn
      } = input;

      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        throw new Error('User already exists');
      }

      const user = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        address,
        dateOfBirth,
        bvn
      });

      await mapleradUserAccountService.createUserAccountOnMaplerad(user.id);

      await walletService.createDefaultWallets(user.id);

      const token = generateToken({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
      });

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  public async login(input: LoginInput) {
    const { email, password } = input;

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
    });
      
    return { user, token };
  }
}

export default new AuthService();
