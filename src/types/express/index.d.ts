import { UserPayload } from '../../authentication/utils/jwt.util';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
