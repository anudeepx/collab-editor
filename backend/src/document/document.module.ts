import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentGateway } from './document.gateway';
import { DocumentService } from './document.service';

@Module({
    controllers: [DocumentController],
    providers: [DocumentService, DocumentGateway],
})
export class DocumentModule { }
