import { prop, getModelForClass } from '@typegoose/typegoose';

export class Margin {
  @prop({ default: "Currency Exchange Margin" })
  public name!: string;

  @prop()
  public margin!: number;
}

const MarginModel = getModelForClass(Margin);
export default MarginModel;
