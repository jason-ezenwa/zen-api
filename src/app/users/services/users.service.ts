import { logEvent } from "../../../utils";
import { AuthService } from "../../authentication/services/auth.service";
import { NotFoundError } from "../../errors";
import UserModel from "../models/user.model";

export class UsersService {
  constructor(private AuthService: AuthService) {}

  async getUserById(id: string) {
    try {
      const user = await UserModel.findById(id);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const userWithoutSensitiveData =
        await this.AuthService.removeSensitiveData(user);

      return userWithoutSensitiveData;
    } catch (error: any) {
      logEvent("error", "error getting user by id", error.message);

      throw error;
    }
  }
}
