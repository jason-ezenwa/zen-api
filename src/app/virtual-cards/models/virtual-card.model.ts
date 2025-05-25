import {
	getModelForClass,
	modelOptions,
	prop,
	Ref,
} from "@typegoose/typegoose";
import { User } from "../../users/models/user.model";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class VirtualCard {
  @prop({ required: true })
  public user: Ref<User>;

  @prop({ required: true })
  public cardReference: string;

  /**
   * cardId is the id of the card in maplerad
   */
  @prop({ required: true })
  public cardId: string;

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public number: string;

  @prop({ required: true })
  public expiry: string;

  @prop({ required: true })
  public cvv: string;

  @prop({ required: true })
  public maskedPan: string;

  @prop({ required: true })
  public issuer: string;

  @prop({ required: true })
  public currency: string;

  @prop({ required: true })
  public type: string;

  @prop({ required: true, default: "ACTIVE" })
  public status: string;

  @prop({ required: true, default: 0 })
  public balance: number;
}

const VirtualCardModel = getModelForClass(VirtualCard);

export default VirtualCardModel;
