import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class UserMapleRadAccount {
  @prop({ required: true })
  public user!: Ref<User>;

  @prop({ required: true })
  public userMapleRadAccountId!: string;

  @prop({ required: true })
  public tier!: number;
}

const UserMapleRadAccountModel = getModelForClass(UserMapleRadAccount);

export default UserMapleRadAccountModel;