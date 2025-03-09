import { prop, getModelForClass, Ref, modelOptions } from '@typegoose/typegoose';
import { User } from '../../users/models/user.model'; 

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
class Wallet {
  @prop()
  public user!: Ref<User>;

  @prop()
  public currency!: string;

  @prop({ default: 0 })
  public balance!: number;
}

const WalletModel = getModelForClass(Wallet);
export default WalletModel;
