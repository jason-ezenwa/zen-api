import { prop, getModelForClass } from '@typegoose/typegoose';

export class CurrencyExchangeMargin {
  @prop({ default: "Currency Exchange Margin" })
  public name!: string;

  @prop()
  public marginInPercentage!: number;
}

const CurrencyExchangeMarginModel = getModelForClass(CurrencyExchangeMargin);
export default CurrencyExchangeMarginModel;
