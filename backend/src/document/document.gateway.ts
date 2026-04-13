import {
  ForbiddenException,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { auth } from "../auth/auth.config.js";
import { fromNodeHeaders } from "better-auth/node";
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { DocumentService } from "./document.service.js";
import { EditDocumentDto } from "./dto/edit-document.dto.js";
import { JoinDocumentDto } from "./dto/join-document.dto.js";

type AuthenticatedSocket = Socket & {
  data: {
    userId?: string;
  };
};

type JoinAck =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHORIZED" | "NOT_FOUND";
    };

type EditAck =
  | {
      ok: true;
      update: {
        documentId: string;
        content: string;
        updatedAt: string;
        currentVersion: number;
      };
    }
  | {
      ok: false;
      error:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "VERSION_CONFLICT"
        | "RATE_LIMITED"
        | "INTERNAL_ERROR";
      latest?: {
        documentId: string;
        content: string;
        updatedAt: string;
        currentVersion: number;
      };
    };

const FRONTEND_ORIGIN =
  process.env.CLIENT_URL?.trim() || "http://localhost:3000";
const MIN_EDIT_INTERVAL_MS = 120;

@WebSocketGateway({
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  },
})
export class DocumentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly lastEditAtBySocket = new Map<string, number>();

  constructor(private readonly documentService: DocumentService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const userId = await this.resolveUserId(client);

    if (!userId) {
      client.emit("auth_error", { message: "UNAUTHORIZED" });
      client.disconnect(true);
      return;
    }

    this.setUserId(client, userId);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.lastEditAtBySocket.delete(client.id);

    for (const roomId of client.rooms) {
      if (roomId !== client.id) {
        this.emitPresence(roomId);
      }
    }
  }

  @SubscribeMessage("join")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinDocumentDto,
    @Ack() ack?: (response: JoinAck) => void,
  ): Promise<void> {
    const userId = this.getUserId(client);

    if (!userId) {
      ack?.({ ok: false, error: "UNAUTHORIZED" });
      return;
    }

    try {
      await this.documentService.assertCanView(payload.documentId, userId);
    } catch {
      ack?.({ ok: false, error: "NOT_FOUND" });
      return;
    }

    await client.join(payload.documentId);
    this.emitPresence(payload.documentId);
    ack?.({ ok: true });
  }

  @SubscribeMessage("leave")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinDocumentDto,
    @Ack() ack?: (response: JoinAck) => void,
  ): Promise<void> {
    const userId = this.getUserId(client);

    if (!userId) {
      ack?.({ ok: false, error: "UNAUTHORIZED" });
      return;
    }

    await client.leave(payload.documentId);
    this.emitPresence(payload.documentId);
    ack?.({ ok: true });
  }

  @SubscribeMessage("edit")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleEdit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: EditDocumentDto,
    @Ack() ack?: (response: EditAck) => void,
  ): Promise<void> {
    const userId = this.getUserId(client);

    if (!userId) {
      ack?.({ ok: false, error: "UNAUTHORIZED" });
      return;
    }

    const now = Date.now();
    const previousEditAt = this.lastEditAtBySocket.get(client.id) ?? 0;
    if (now - previousEditAt < MIN_EDIT_INTERVAL_MS) {
      ack?.({ ok: false, error: "RATE_LIMITED" });
      return;
    }
    this.lastEditAtBySocket.set(client.id, now);

    try {
      const result = await this.documentService.update(
        userId,
        payload.documentId,
        {
          content: payload.content,
          baseVersion: payload.baseVersion,
        },
      );

      if (result.status === "conflict") {
        ack?.({
          ok: false,
          error: "VERSION_CONFLICT",
          latest: this.toUpdatePayload(result.latest),
        });
        return;
      }

      const updatePayload = this.toUpdatePayload(result.document);
      this.server.to(payload.documentId).emit("update", updatePayload);
      ack?.({
        ok: true,
        update: updatePayload,
      });
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        ack?.({ ok: false, error: "NOT_FOUND" });
        return;
      }

      ack?.({ ok: false, error: "INTERNAL_ERROR" });
    }
  }

  private emitPresence(documentId: string): void {
    const room = this.server.sockets.adapter.rooms.get(documentId);
    const activeUsers = room?.size ?? 0;

    this.server.to(documentId).emit("presence", {
      documentId,
      activeUsers,
    });
  }

  private toUpdatePayload(document: {
    id: string;
    content: string;
    updatedAt: Date;
    currentVersion: number;
  }) {
    return {
      documentId: document.id,
      content: document.content,
      updatedAt: document.updatedAt.toISOString(),
      currentVersion: document.currentVersion,
    };
  }

  private async resolveUserId(
    client: AuthenticatedSocket,
  ): Promise<string | null> {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(client.handshake.headers),
      });

      return session?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  private getUserId(client: AuthenticatedSocket): string | null {
    const userId = (client.data as { userId?: unknown }).userId;
    return typeof userId === "string" ? userId : null;
  }

  private setUserId(client: AuthenticatedSocket, userId: string): void {
    (client.data as { userId?: string }).userId = userId;
  }
}
