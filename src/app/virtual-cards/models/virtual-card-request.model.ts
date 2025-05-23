import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose";
import { User } from "../../users/models/user.model";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class VirtualCardRequest {
  @prop({ required: true })
  public user!: Ref<User>;

  @prop({ required: true })
  public cardReference!: string;

  @prop({ required: true, default: "PENDING" })
  public status!: string;
}

const VirtualCardRequestModel = getModelForClass(VirtualCardRequest);

export default VirtualCardRequestModel;