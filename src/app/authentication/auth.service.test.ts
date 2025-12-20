import UserModel from "../users/models/user.model";
import { AuthService } from "./auth.service";
import mapleradUserAccountService from "../users/services/maplerad-user-account.service";
import { WalletService } from "../wallets/wallet.service";
import { createMock } from "@golevelup/ts-jest";

describe("AuthService", () => {
  let authService: AuthService;

  const walletService = createMock<WalletService>();

  beforeEach(() => {
    authService = new AuthService(walletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should throw an error if user does not exist", async () => {
      const input = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      jest.spyOn(UserModel, "findOne").mockResolvedValue(null);

      await expect(authService.login(input)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw an error if password is incorrect", async () => {
      const existingUser = {
        email: "existing@example.com",
        password: "correctpassword",
        comparePassword: jest.fn(),
      };

      const input = {
        email: existingUser.email,
        password: "incorrectpassword",
      };

      jest.spyOn(UserModel, "findOne").mockResolvedValue(existingUser);
      jest.spyOn(existingUser, "comparePassword").mockResolvedValue(false);

      await expect(authService.login(input)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should return user and token if login is successful", async () => {
      const existingUser = {
        email: "existing@example.com",
        password: "correctpassword",
        comparePassword: jest.fn(),
      };

      const input = {
        email: existingUser.email,
        password: existingUser.password,
      };

      jest.spyOn(UserModel, "findOne").mockResolvedValue(existingUser);
      jest
        .spyOn(authService, "removeSensitiveData")
        .mockResolvedValueOnce(existingUser);
      jest.spyOn(existingUser, "comparePassword").mockResolvedValue(true);

      const result = await authService.login(input);

      expect(result.user).toEqual(existingUser);
      expect(result.token).toBeDefined();
    });
  });

  describe("register", () => {
    it("should throw an error if user already exists", async () => {
      const existingUser = {
        email: "existing@example.com",
      };

      const input = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "2001-05-18T00:00:00.000Z",
        email: existingUser.email,
        password: "password123",
        phoneNumber: "+2347000000000",
        bvn: "123456",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001",
        },
      };

      jest.spyOn(UserModel, "findOne").mockResolvedValue(existingUser);

      await expect(authService.register(input)).rejects.toThrow(
        "User already exists"
      );
    });

    it("should create a new user and return user and token", async () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "2001-05-18T00:00:00.000Z",
        email: "newuser@example.com",
        password: "password123",
        phoneNumber: "+2347000000000",
        bvn: "123456",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001",
        },
      };

      jest.spyOn(UserModel, "findOne").mockResolvedValue(null);

      jest
        .spyOn(mapleradUserAccountService, "createUserAccountOnMaplerad")
        .mockResolvedValue(true);

      jest.spyOn(walletService, "createDefaultWallets").mockResolvedValue([]);
      jest.spyOn(authService, "removeSensitiveData").mockResolvedValue({
        ...input,
        password: undefined,
        bvn: undefined,
      } as any);

      const userCreateSpy = jest
        .spyOn(UserModel, "create")
        .mockResolvedValue({} as any);

      const result = await authService.register(input);

      expect(result.user).toBeDefined();

      expect(result.token).toBeDefined();

      expect(userCreateSpy).toHaveBeenCalledWith({
        ...input,
        dateOfBirth: new Date(input.dateOfBirth),
      });
    });
  });
});
