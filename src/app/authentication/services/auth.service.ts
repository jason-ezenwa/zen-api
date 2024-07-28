import UserModel from '../../users/models/user.model';
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
    const { email } = input;

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = new UserModel(input);

    await UserModel.create(user);

    await walletService.createDefaultWallets(user.id);

    const token = generateToken(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
      }
    );
    return { user, token };
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
