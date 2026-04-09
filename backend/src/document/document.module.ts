import { Module } from "@nestjs/common";
import { SessionGuard } from "../common/guards/session.guard.js";
import { DocumentController } from "./document.controller.js";
import { DocumentGateway } from "./document.gateway.js";
import { DocumentService } from "./document.service.js";

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, DocumentGateway, SessionGuard],
})
export class DocumentModule {}
