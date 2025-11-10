import { JsonController, Get, Authorized, Req } from "routing-controllers";
import { Request } from "express";
import { AuthService } from "../../authentication/services/auth.service";
import { NotFoundError, UnauthorizedError } from "../../errors";
import { UsersService } from "../services/users.service";

@JsonController("/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/me")
  @Authorized()
  async me(@Req() req: Request) {
    const requestUser = req.user;

    if (!requestUser) {
      throw new UnauthorizedError("User not found");
    }

    const user = await this.usersService.getUserById(requestUser.id);
    return { user };
  }
}
