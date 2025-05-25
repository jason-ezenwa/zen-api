import {
  getModelForClass,
  modelOptions,
  prop,
  Ref,
} from "@typegoose/typegoose";
import { VirtualCard } from "./virtual-card.model";
import { TransactionStatus } from "../../../types";
import { User } from "../../users/models/user.model";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class VirtualCardTransaction {
  @prop({ required: true })
  card: Ref<VirtualCard>;

  @prop({ required: true })
  user: Ref<User>;

  @prop({ required: true })
  amount: number;

  @prop({ required: true })
  currency: string;

  @prop({ required: true })
  description: string;

  @prop({ required: true })
  status: TransactionStatus;

  createdAt: Date;
}

export const VirtualCardTransactionModel = getModelForClass(
  VirtualCardTransaction
);
