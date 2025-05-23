import jwt from 'jsonwebtoken';
import config from '../../../config';

interface UserPayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  phoneNumber: string;
}

export const generateToken = (user: UserPayload) => {
  return jwt.sign(
    {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
    },
    config.jwtSecret,
    { expiresIn: "4h" }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
}
