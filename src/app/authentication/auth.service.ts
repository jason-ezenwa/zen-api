import { Service } from "typedi";
import { DocumentType } from "@typegoose/typegoose";
import UserModel, { User } from "../users/models/user.model";
import mapleradUserAccountService from "../users/services/maplerad-user-account.service";
import { Container } from "typedi";
import { WalletService } from "../wallets/wallet.service";
import { generateToken } from "./utils/jwt.util";
import { BadRequestError } from "../errors";

interface RegisterInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
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

@Service()
export class AuthService {
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
        bvn,
      } = input;

      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        throw new BadRequestError("User already exists");
      }

      const user = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        address,
        dateOfBirth: new Date(dateOfBirth),
        bvn,
      });

      await mapleradUserAccountService.createUserAccountOnMaplerad(user.id);

      const walletService = Container.get(WalletService);
      await walletService.createDefaultWallets(user.id);

      const token = generateToken({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
      });

      const userWithoutSensitiveData = await this.removeSensitiveData(user);

      return { user: userWithoutSensitiveData, token };
    } catch (error) {
      throw error;
    }
  }

  public async login(input: LoginInput) {
    const { email, password } = input;

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new BadRequestError("Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
    });

    const userWithoutSensitiveData = await this.removeSensitiveData(user);

    return { user: userWithoutSensitiveData, token };
  }

  async removeSensitiveData(user: DocumentType<User>) {
    const sensitiveData = ["password", "bvn"];

    const userObject = user.toObject();

    return Object.fromEntries(
      Object.entries(userObject).filter(([key]) => !sensitiveData.includes(key))
    );
  }
}

export default new AuthService();
