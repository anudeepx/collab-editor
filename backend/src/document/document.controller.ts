import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateDocumentDto } from "./dto/create-document.dto.js";
import { DocumentService } from "./document.service.js";

@Controller('documents')
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    @Post()
    create(@Body() createDocumentDto: CreateDocumentDto) {
        return this.documentService.create(createDocumentDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.documentService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body('content') content: string,
    ) {
        return this.documentService.update(id, content ?? '');
    }
}
