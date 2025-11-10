import {
  JsonController,
  Post,
  Get,
  Authorized,
  Body,
  Param,
  QueryParam,
  Req,
} from "routing-controllers";
import { Request } from "express";
import WalletService from "../services/wallet.service";
import { CreateWalletDto } from "../../common/dtos/wallet/create-wallet.dto";
import { FundWalletDto } from "../../common/dtos/wallet/fund-wallet.dto";

@JsonController("/wallets")
export class WalletController {
  @Post()
  @Authorized()
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    const wallet = await WalletService.createWallet(
      userId,
      createWalletDto.currency
    );
    return wallet;
  }

  @Get()
  @Authorized()
  async getWallets(@Req() req: Request) {
    const userId = req.user.id;
    const wallets = await WalletService.getWalletsByUserId(userId);
    return { wallets };
  }

  @Get("/:walletId")
  @Authorized()
  async getWallet(@Param("walletId") walletId: string) {
    const wallet = await WalletService.getWalletByWalletId(walletId);
    return { wallet };
  }

  @Post("/:walletId/fund")
  @Authorized()
  async fundWallet(
    @Param("walletId") walletId: string,
    @Body() fundWalletDto: FundWalletDto
  ) {
    const dto = { ...fundWalletDto, walletId };
    const { paymentLink, depositId } = await WalletService.fundWallet(dto);
    return { message: "Initialising deposit", paymentLink, depositId };
  }

  @Get("/deposits")
  @Authorized()
  async getMyDeposits(@Req() req: Request, @QueryParam("page") page?: number) {
    const userId = req.user.id;
    const dto = {
      userId,
      page: page || 1,
    };
    const result = await WalletService.getUserDeposits(dto);
    return result;
  }
}
