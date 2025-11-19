import { IsString, IsNumber, Min, IsIn } from 'class-validator';
import { ALLOWED_CURRENCIES } from '../../../../constants';

export class GenerateFXQuoteDto {
  @IsString()
  @IsIn(ALLOWED_CURRENCIES)
  sourceCurrency: string;

  @IsString()
  @IsIn(ALLOWED_CURRENCIES)
  targetCurrency: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
