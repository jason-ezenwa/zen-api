import { Action } from 'routing-controllers';
import { verifyToken } from '../app/authentication/utils/jwt.util';

export function authorizationChecker(action: Action, roles: string[]) {
  const token = action.request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return false;
  }

  try {
    const decoded = verifyToken(token) as any;
    action.request.user = decoded;
    return true;
  } catch (error) {
    return false;
  }
}
