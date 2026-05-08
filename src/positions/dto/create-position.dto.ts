import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(2, 500)
  description: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
