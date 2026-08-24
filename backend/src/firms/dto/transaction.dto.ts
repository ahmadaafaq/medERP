import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TransactionStatus } from '../../database/entities/transaction.entity';

export class CreateTransactionDto {
  @IsUUID()
  @IsOptional()
  license_key_id?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'INR';

  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @IsString()
  @IsNotEmpty()
  transaction_ref: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus = TransactionStatus.SUCCESS;

  @IsNumber()
  @Min(1)
  @IsOptional()
  duration_days?: number = 365;

  @IsOptional()
  is_renewal?: boolean = false;
}
