import {
  JsonController,
  Post,
  Get,
  Put,
  Authorized,
  Body,
  Param,
  Req,
  QueryParam,
} from "routing-controllers";
import { Service } from "typedi";
import { Request } from "express";
import virtualCardsService from "../services/virtual-cards.service";
import { logEvent } from "../../../utils";
import { CreateVirtualCardDto } from "../../common/dtos/virtual-cards/create-virtual-card.dto";
import { FundVirtualCardDto } from "../../common/dtos/virtual-cards/fund-virtual-card.dto";

@Service()
@JsonController("/virtual-cards")
export class VirtualCardsController {
  @Post()
  @Authorized()
  async createVirtualCard(
    @Body() createCardDto: CreateVirtualCardDto,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    const virtualCardRequest = await virtualCardsService.createVirtualCard(
      userId,
      createCardDto.currency,
      createCardDto.brand,
      createCardDto.cardPin
    );
    const obj = virtualCardRequest.toObject();
    return {
      ...obj,
      _id: obj._id.toString(),
      user: obj.user?.toString() || obj.user,
    };
  }

  @Get()
  @Authorized()
  async getVirtualCardsForUser(@Req() req: Request) {
    const userId = req.user.id;
    const virtualCards = await virtualCardsService.getVirtualCardsForUser(
      userId
    );
    return {
      virtualCards: virtualCards.map((virtualCard) => {
        const obj = virtualCard.toObject();
        return {
          ...obj,
          _id: obj._id.toString(),
          user: obj.user?.toString() || obj.user,
        };
      }),
    };
  }

  @Get("/my-transactions")
  @Authorized()
  async getMyVirtualCardTransactions(
    @Req() req: Request,
    @QueryParam("page") page?: number
  ) {
    const userId = req.user.id;
    const dto = {
      userId,
      page: page || 1,
    };
    const result = await virtualCardsService.getVirtualCardTransactions(dto);
    return {
      ...result,
      cardTransactions: result.cardTransactions.map((transaction) => {
        const obj = transaction.toObject();
        return {
          ...obj,
          _id: obj._id.toString(),
          user: obj.user?.toString() || obj.user,
        };
      }),
    };
  }

  @Get("/:cardId")
  @Authorized()
  async getVirtualCard(@Param("cardId") cardId: string) {
    const virtualCard = await virtualCardsService.getVirtualCard(cardId);
    const obj = virtualCard.toObject();
    return {
      virtualCard: {
        ...obj,
        _id: obj._id.toString(),
        user: obj.user?.toString() || obj.user,
      },
    };
  }

  @Put("/:cardId/freeze")
  @Authorized()
  async freezeVirtualCard(@Param("cardId") cardId: string) {
    const virtualCard = await virtualCardsService.freezeVirtualCard(cardId);
    if (!virtualCard) {
      throw new Error("Unable to freeze virtual card");
    }
    const obj = virtualCard.toObject();
    return {
      virtualCard: {
        ...obj,
        _id: obj._id.toString(),
        user: obj.user?.toString() || obj.user,
      },
    };
  }

  @Put("/:cardId/unfreeze")
  @Authorized()
  async unfreezeVirtualCard(@Param("cardId") cardId: string) {
    const virtualCard = await virtualCardsService.unfreezeVirtualCard(cardId);
    if (!virtualCard) {
      throw new Error("Unable to unfreeze virtual card");
    }
    const obj = virtualCard.toObject();
    return {
      virtualCard: {
        ...obj,
        _id: obj._id.toString(),
        user: obj.user?.toString() || obj.user,
      },
    };
  }

  @Post("/:cardId/fund")
  @Authorized()
  async fundVirtualCard(
    @Param("cardId") cardId: string,
    @Body() fundCardDto: FundVirtualCardDto,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    const success = await virtualCardsService.fundVirtualCard(
      userId,
      cardId,
      fundCardDto.amount
    );
    return { success };
  }
}
