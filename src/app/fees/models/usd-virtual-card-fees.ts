import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
	schemaOptions: {
		timestamps: true,
	},
})
export class USDVirtualCardFees {
	@prop({ required: true })
	public currency!: string;

	@prop({ required: true })
	public name!: string;

	@prop({ required: true })
	public fee!: number;
}

const USDVirtualCardFeesModel = getModelForClass(USDVirtualCardFees);

export default USDVirtualCardFeesModel;
