import { IsUUID } from "class-validator";

export class JoinDocumentDto {
  @IsUUID()
  documentId!: string;
}
