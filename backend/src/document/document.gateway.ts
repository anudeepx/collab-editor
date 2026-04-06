import {
  MessageBody,
  ConnectedSocket,
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

  @SubscribeMessage("join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string },
  ) {
    if (!payload?.documentId) {
      return;
    }

    client.join(payload.documentId);
    console.log(
      `[ws] client ${client.id} joined document room ${payload.documentId}`,
    );
  }

  @SubscribeMessage("edit")
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; content: string },
  ) {
    if (!payload?.documentId) {
      return;
    }

    const updatedDocument = await this.documentService.update(
      payload.documentId,
      payload.content ?? "",
    );

    console.log(
      `[ws] edit from ${client.id} for ${payload.documentId} (${updatedDocument.content.length} chars)`,
    );

    // Broadcast to every other client in this room, excluding the sender.
    client.to(payload.documentId).emit("update", {
      documentId: payload.documentId,
      content: updatedDocument.content,
      updatedAt: updatedDocument.updatedAt,
    });
  }
}
