import {
  prop,
  getModelForClass,
  Ref,
  modelOptions,
} from "@typegoose/typegoose";
import { User } from "../../users/models/user.model";
import { TransactionStatus } from "../../../types";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class CurrencyExchange {
  @prop({ required: true })
  user: Ref<User>;

  @prop({ required: true })
  sourceCurrency: string;

  @prop({ required: true })
  targetCurrency: string;

  @prop({ required: true })
  sourceAmount: number;

  @prop({ required: true })
  targetAmount: number;

  @prop({ required: true })
  status: TransactionStatus;

  @prop({ required: true })
  reference: string;

  createdAt: Date;

  updatedAt: Date;
}

const CurrencyExchangeModel = getModelForClass(CurrencyExchange);

export default CurrencyExchangeModel;
