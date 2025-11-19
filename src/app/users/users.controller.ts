import { JsonController, Get, Authorized, Req } from "routing-controllers";
import { Service } from "typedi";
import { Request } from "express";
import { UnauthorizedError } from "../errors";
import { UsersService } from "./services/users.service";

@Service()
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
