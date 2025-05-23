import { Request } from "express";
import VirtualCardRequestModel from "../virtual-cards/models/virtual-card-request.model";
import VirtualCardModel, {
	VirtualCard,
} from "../virtual-cards/models/virtual-card.model";
import { UnauthorizedError } from "../errors";
import virtualCardService from "../virtual-cards/services/virtual-cards.service";
class WebhookService {
  async handleCardCreation(req: Request) {
    try {
      const cardReference = req.body.reference;

      await virtualCardService.handleVirtualCardCreation(cardReference);

      return true;
    } catch (error) {
      console.log(error);
      throw new Error("Internal Server Error");
    }
  }

  async handleCardCreationFailed(req: Request) {
    try {
      const cardReference = req.body.reference;

      const virtualCardRequest = await VirtualCardRequestModel.findOne({
        cardReference,
      });

      if (!virtualCardRequest) {
        throw new Error("Virtual card request not found");
      }

      await VirtualCardRequestModel.updateOne(
        { cardReference },
        { status: "FAILED" }
      );
    } catch (error) {
      console.log(error);
      throw new Error("Internal Server Error");
    }
  }
}

export default new WebhookService();
