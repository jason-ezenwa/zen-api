import { prop, getModelForClass, Ref, modelOptions } from '@typegoose/typegoose';
import { User } from '../../users/models/user.model'; 

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Wallet {
  @prop()
  user: Ref<User>;

  @prop()
  currency: string;

  @prop({ default: 0 })
  balance: number;
}

const WalletModel = getModelForClass(Wallet);
export default WalletModel;
