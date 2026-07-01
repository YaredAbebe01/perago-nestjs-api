import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(2, 500)
  description: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value === '' ? null : value))
  email?: string | null;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? null : value))
  parentId?: string | null;
}
