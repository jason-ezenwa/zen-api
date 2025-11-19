import { Service } from "typedi";
import { logEvent } from "../../../utils";
import { AuthService } from "../../authentication/auth.service";
import { NotFoundError } from "../../errors";
import UserModel from "../models/user.model";

@Service()
export class UsersService {
  constructor(private authService: AuthService) {}

  async getUserById(id: string) {
    try {
      const user = await UserModel.findById(id);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const userWithoutSensitiveData =
        await this.authService.removeSensitiveData(user);

      return userWithoutSensitiveData;
    } catch (error: any) {
      logEvent("error", "error getting user by id", error.message);

      throw error;
    }
  }
}
