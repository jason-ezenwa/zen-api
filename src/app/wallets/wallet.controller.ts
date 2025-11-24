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
import { Service } from "typedi";
import { Request } from "express";
import { WalletService } from "./wallet.service";
import { CreateWalletDto } from "../common/dtos/wallet/create-wallet.dto";
import { FundWalletDto } from "../common/dtos/wallet/fund-wallet.dto";

@Service()
@JsonController("/wallets")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  @Post()
  @Authorized()
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    const wallet = await this.walletService.createWallet(
      userId,
      createWalletDto.currency
    );
    const obj = wallet.toObject();
    return {
      ...obj,
      _id: obj._id.toString(),
      user: obj.user?.toString(),
    };
  }

  @Get()
  @Authorized()
  async getWallets(@Req() req: Request) {
    const userId = req.user.id;
    const wallets = await this.walletService.getWalletsByUserId(userId);
    const transformedWallets = wallets.map((wallet) => {
      const obj = wallet.toObject();
      return {
        ...obj,
        _id: obj._id.toString(),
        user: obj.user?.toString(),
      };
    });
    return {
      wallets: transformedWallets,
    };
  }

  @Get("/deposits")
  @Authorized()
  async getMyDeposits(@Req() req: Request, @QueryParam("page") page?: number) {
    const userId = req.user.id;
    const dto = {
      userId,
      page: page || 1,
    };
    const result = await this.walletService.getUserDeposits(dto);
    return {
      ...result,
      deposits: result.deposits.map((deposit) => {
        const obj = deposit.toObject();
        return {
          ...obj,
          _id: obj._id.toString(),
          user: obj.user?.toString(),
        };
      }),
    };
  }

  @Get("/:walletId")
  @Authorized()
  async getWallet(@Param("walletId") walletId: string) {
    const wallet = await this.walletService.getWalletByWalletId(walletId);
    const obj = wallet.toObject();
    return {
      wallet: {
        ...obj,
        _id: obj._id.toString(),
        user: obj.user?.toString() || obj.user,
      },
    };
  }

  @Post("/fund")
  @Authorized()
  async fundWallet(@Body() fundWalletDto: FundWalletDto) {
    const { paymentLink, depositId } = await this.walletService.fundWallet(
      fundWalletDto
    );
    return { message: "Initialising deposit", paymentLink, depositId };
  }
}
