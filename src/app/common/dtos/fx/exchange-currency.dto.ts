import { IsString } from 'class-validator';

export class ExchangeCurrencyDto {
  @IsString()
  quoteReference: string;
}
