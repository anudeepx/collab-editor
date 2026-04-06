import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DocumentService } from "./document.service.js";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class DocumentGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly documentService: DocumentService) {}

  @SubscribeMessage("join-document")
  async handleJoin(
    client: Socket,
    @MessageBody() payload: { documentId: string },
  ) {
    if (!payload?.documentId) {
      return;
    }

    client.join(payload.documentId);
    const document = await this.documentService.findOne(payload.documentId);
    client.emit("document-updated", document);
  }

  @SubscribeMessage("edit-document")
  async handleEdit(
    @MessageBody() payload: { documentId: string; content: string },
  ) {
    if (!payload?.documentId) {
      return;
    }

    const updatedDocument = await this.documentService.update(
      payload.documentId,
      payload.content ?? "",
    );

    this.server
      .to(payload.documentId)
      .emit("document-updated", updatedDocument);
  }
}
