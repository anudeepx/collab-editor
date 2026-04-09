import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDocumentDto {
  @IsString()
  @MaxLength(200_000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
