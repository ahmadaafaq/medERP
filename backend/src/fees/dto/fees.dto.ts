import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateFeeStructureDto {
  @IsString()
  @IsOptional()
  courseCd?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsNotEmpty()
  feeType: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class RecordFeePaymentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  feeStructureId: string;

  @IsNumber()
  amountPaid: number;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  receiptNo?: string;
}
