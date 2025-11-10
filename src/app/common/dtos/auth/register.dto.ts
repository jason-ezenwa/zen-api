import { IsEmail, IsString, MinLength, IsDateString, IsObject, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  zipCode: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  @MinLength(10)
  phoneNumber: string;

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  dateOfBirth: Date;

  @IsString()
  bvn: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
