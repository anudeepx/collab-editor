import { IsInt, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class EditDocumentDto {
  @IsUUID()
  documentId!: string;

  @IsString()
  @MaxLength(200_000)
  content!: string;

  @IsInt()
  @Min(1)
  baseVersion!: number;
}
