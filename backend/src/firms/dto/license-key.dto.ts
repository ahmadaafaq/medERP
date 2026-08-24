import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GenerateLicenseKeyDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  duration_days: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number = 0;
}

export class ApplyLicenseKeyDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}

export class RenewLicenseKeyDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  duration_days: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number = 0;

  @IsUUID()
  @IsOptional()
  previous_key_id?: string;

  @IsString()
  @IsOptional()
  payment_method?: string = 'bank_transfer';

  @IsString()
  @IsOptional()
  transaction_ref?: string;
}
