import { compare } from 'bcryptjs';
import UserModel from '../../users/models/user.model';
import AuthService from './auth.service';

describe('AuthService', () => {
  describe('login', () => {
    it('should throw an error if user does not exist', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      await expect(AuthService.login(input)).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error if password is incorrect', async () => {
      const existingUser = {
        email: 'existing@example.com',
        password: 'correctpassword',
        comparePassword: jest.fn(),
      };

      const input = {
        email: existingUser.email,
        password: 'incorrectpassword',
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(existingUser);
      jest.spyOn(existingUser, 'comparePassword').mockResolvedValue(false);

      await expect(AuthService.login(input)).rejects.toThrow('Invalid credentials');
    });

    it('should return user and token if login is successful', async () => {
      const existingUser = {
        email: 'existing@example.com',
        password: 'correctpassword',
        comparePassword: jest.fn(),
      };

      const input = {
        email: existingUser.email,
        password: existingUser.password,
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(existingUser);
      jest.spyOn(existingUser, 'comparePassword').mockResolvedValue(true);

      const result = await AuthService.login(input);

      expect(result.user).toEqual(existingUser);
      expect(result.token).toBeDefined();
    });
  });

  describe('register', () => {
    it('should throw an error if user already exists', async () => {
      const existingUser = {
        email: 'existing@example.com',
      };

      const input = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        email: existingUser.email,
        password: 'password123',
        phoneNumber: '+2347000000000',
        bvn: '123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
        },
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(existingUser);

      await expect(AuthService.register(input)).rejects.toThrow('User already exists');
    });

    it('should create a new user and return user and token', async () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        email: 'newuser@example.com',
        password: 'password123',
        phoneNumber: '+2347000000000',
        bvn: '123456',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
        },
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const userCreateSpy = jest.spyOn(UserModel, 'create').mockResolvedValue({} as any);

      const result = await AuthService.register(input);

      expect(result.user).toBeDefined();

      expect(result.token).toBeDefined();

      expect(userCreateSpy).toHaveBeenCalledWith(expect.objectContaining(input));
    });
  });
});