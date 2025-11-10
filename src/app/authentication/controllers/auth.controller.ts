import { JsonController, Post, Body } from "routing-controllers";
import AuthService from "../services/auth.service";
import { RegisterDto } from "../../common/dtos/auth/register.dto";
import { LoginDto } from "../../common/dtos/auth/login.dto";
import { HttpCode } from "routing-controllers";

@JsonController("/auth")
export class AuthController {
  @Post("/register")
  @HttpCode(201)
  async register(@Body() registerData: RegisterDto) {
    return await AuthService.register(registerData);
  }

  @Post("/login")
  async login(@Body() loginData: LoginDto) {
    return await AuthService.login(loginData);
  }
}
