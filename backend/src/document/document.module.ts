import { Module } from "@nestjs/common";
import { DocumentController } from "./document.controller.js";
import { DocumentGateway } from "./document.gateway.js";
import { DocumentService } from "./document.service.js";

@Module({
    controllers: [DocumentController],
    providers: [DocumentService, DocumentGateway],
})
export class DocumentModule { }
