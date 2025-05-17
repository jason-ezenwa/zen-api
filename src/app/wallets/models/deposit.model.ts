import { modelOptions, Ref, getModelForClass } from "@typegoose/typegoose";
import { prop } from "@typegoose/typegoose";
import { User } from "../../users/models/user.model";
import { Wallet } from "./wallet.model";
import { TransactionStatus } from "../../../types";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
class Deposit {
  @prop({ required: true })
  user: Ref<User>;

  @prop({ required: true })
  wallet: Ref<Wallet>;

  @prop({ required: true })
  subTotal: number;

  @prop({ required: true })
  fee: number;

  @prop({ required: true })
  total: number;

  @prop({ required: true })
  currency: string;

  @prop({ required: true })
  reference: string;

  @prop({ required: true })
  status: TransactionStatus;

  createdAt: Date;

  updatedAt: Date;
}

const DepositModel = getModelForClass(Deposit);
export default DepositModel;
