import { IsString, IsNumber, Min } from 'class-validator';

export class FundWalletDto {
  @IsString()
  walletId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
