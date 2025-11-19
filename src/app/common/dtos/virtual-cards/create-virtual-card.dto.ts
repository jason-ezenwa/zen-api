import { IsString, IsIn, MinLength, MaxLength } from 'class-validator';
import { ALLOWED_CARD_BRANDS } from "../../../../constants";

export class CreateVirtualCardDto {
  @IsString()
  @IsIn(["USD"])
  currency: string;

  @IsString()
  @IsIn(ALLOWED_CARD_BRANDS)
  brand: string;

  @IsString()
  @MinLength(4)
  @MaxLength(4)
  cardPin: string;
}
