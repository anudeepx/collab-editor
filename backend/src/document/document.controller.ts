import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js";
import { SessionGuard } from "../common/guards/session.guard.js";
import { CreateDocumentDto } from "./dto/create-document.dto.js";
import { ListDocumentsQueryDto } from "./dto/list-documents-query.dto.js";
import { UpdateDocumentDto } from "./dto/update-document.dto.js";
import { DocumentService } from "./document.service.js";

@Controller("documents")
@UseGuards(SessionGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Query() query: ListDocumentsQueryDto,
  ) {
    return this.documentService.findAll(userId, query.limit);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    return this.documentService.create(userId, createDocumentDto);
  }

  @Get(":id")
  findOne(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.documentService.findOne(id, userId);
  }

  @Patch(":id")
  async update(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    const result = await this.documentService.update(userId, id, dto);

    if (result.status === "conflict") {
      throw new ConflictException({
        error: "VERSION_CONFLICT",
        latest: result.latest,
      });
    }

    return result.document;
  }
}
