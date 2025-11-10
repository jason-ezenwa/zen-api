import { IsString, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateVirtualCardDto {
  @IsString()
  @IsIn(['USD'])
  currency: string;

  @IsString()
  @IsIn(['Visa', 'Mastercard'])
  brand: string;

  @IsString()
  @MinLength(4)
  @MaxLength(4)
  cardPin: string;
}
