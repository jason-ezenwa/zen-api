import { AuthService } from "../../authentication/services/auth.service";
import { NotFoundError, UnauthorizedError } from "../../errors";
import { UsersService } from "../services/users.service";
import { Request, response, Response } from "express";

class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async me(req: Request, res: Response) {
    try {
      const requestUser = req.user;

      if (!requestUser) {
        throw new UnauthorizedError("User not found");
      }

      const user = await this.usersService.getUserById(requestUser.id);

      return res.status(200).json({ user });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof UnauthorizedError
      ) {
        return response.status(error.statusCode).json({
          message: error.message,
        });
      }

      return response.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new UsersController(new UsersService(new AuthService()));
