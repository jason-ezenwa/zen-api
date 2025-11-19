import { JsonController, Post, Body } from "routing-controllers";
import { Service } from "typedi";
import { AuthService } from "./auth.service";
import { RegisterDto } from "../common/dtos/auth/register.dto";
import { LoginDto } from "../common/dtos/auth/login.dto";
import { HttpCode } from "routing-controllers";

@Service()
@JsonController("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/register")
  @HttpCode(201)
  async register(@Body() registerData: RegisterDto) {
    return await this.authService.register(registerData);
  }

  @Post("/login")
  async login(@Body() loginData: LoginDto) {
    return await this.authService.login(loginData);
  }
}
