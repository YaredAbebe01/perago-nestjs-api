import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
