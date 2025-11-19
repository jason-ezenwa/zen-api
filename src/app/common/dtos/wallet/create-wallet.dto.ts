import { IsString, IsIn } from 'class-validator';
import { ALLOWED_CURRENCIES } from '../../../../constants';

export class CreateWalletDto {
  @IsString()
  @IsIn(ALLOWED_CURRENCIES)
  currency: string;
}
