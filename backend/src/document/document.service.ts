import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "../../lib/prisma.js";
import { CreateDocumentDto } from "./dto/create-document.dto.js";
import { UpdateDocumentDto } from "./dto/update-document.dto.js";

export type DocumentResponse = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: number;
};

export type DocumentSummaryResponse = {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: number;
};

export type DocumentUpdateResult =
  | { status: "updated"; document: DocumentResponse }
  | { status: "conflict"; latest: DocumentResponse };

type NoteProjection = {
  id: string;
  title: string;
  content: unknown;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: number;
};

@Injectable()
export class DocumentService {
  async create(
    userId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentResponse> {
    const note = await prisma.note.create({
      data: {
        title: this.normalizeTitle(dto.title),
        content: dto.content,
        collaborators: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      select: this.noteSelect,
    });

    return this.toDocumentResponse(note);
  }

  async findOne(id: string, userId: string): Promise<DocumentResponse> {
    const note = await prisma.note.findFirst({
      where: {
        id,
        deletedAt: null,
        collaborators: {
          some: { userId },
        },
      },
      select: this.noteSelect,
    });

    if (!note) {
      throw new NotFoundException(`Document ${id} was not found`);
    }

    return this.toDocumentResponse(note);
  }

  async findAll(
    userId: string,
    limit: number,
  ): Promise<DocumentSummaryResponse[]> {
    const notes = await prisma.note.findMany({
      where: {
        deletedAt: null,
        collaborators: {
          some: { userId },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
      select: this.noteSelect,
    });

    return notes.map((note) => this.toDocumentSummaryResponse(note));
  }

  async assertCanView(id: string, userId: string): Promise<void> {
    const membership = await prisma.noteCollaborator.findFirst({
      where: {
        noteId: id,
        userId,
        note: {
          deletedAt: null,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      throw new NotFoundException(`Document ${id} was not found`);
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentUpdateResult> {
    if (dto.content === undefined && dto.title === undefined) {
      throw new BadRequestException("At least one field must be provided");
    }

    await this.assertCanEdit(id, userId);

    const normalizedTitle =
      dto.title === undefined ? undefined : this.normalizeTitle(dto.title);

    if (dto.content !== undefined) {
      if (dto.baseVersion === undefined) {
        throw new BadRequestException(
          "baseVersion is required when content is provided",
        );
      }

      const updateResult = await prisma.note.updateMany({
        where: {
          id,
          deletedAt: null,
          currentVersion: dto.baseVersion,
        },
        data: {
          content: dto.content,
          currentVersion: { increment: 1 },
          ...(normalizedTitle !== undefined ? { title: normalizedTitle } : {}),
        },
      });

      if (updateResult.count === 0) {
        const latest = await this.findOne(id, userId);
        return { status: "conflict", latest };
      }

      const document = await this.findOne(id, userId);
      return { status: "updated", document };
    }

    await prisma.note.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...(normalizedTitle !== undefined ? { title: normalizedTitle } : {}),
        currentVersion: { increment: 1 },
      },
    });

    const document = await this.findOne(id, userId);
    return { status: "updated", document };
  }

  private readonly noteSelect = {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    currentVersion: true,
  } as const;

  private async assertCanEdit(id: string, userId: string): Promise<void> {
    const membership = await prisma.noteCollaborator.findFirst({
      where: {
        noteId: id,
        userId,
        note: {
          deletedAt: null,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      throw new NotFoundException(`Document ${id} was not found`);
    }

    if (membership.role === "VIEWER") {
      throw new ForbiddenException(
        "You do not have edit access for this document",
      );
    }
  }

  private toDocumentResponse(note: NoteProjection): DocumentResponse {
    return {
      id: note.id,
      title: note.title,
      content: this.normalizeContent(note.content),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      currentVersion: note.currentVersion,
    };
  }

  private toDocumentSummaryResponse(
    note: NoteProjection,
  ): DocumentSummaryResponse {
    return {
      id: note.id,
      title: note.title,
      preview: this.normalizeContent(note.content)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      currentVersion: note.currentVersion,
    };
  }

  private normalizeTitle(title?: string): string {
    const normalized = title?.trim() ?? "";
    return normalized.length > 0 ? normalized : "Untitled document";
  }

  private normalizeContent(content: unknown): string {
    if (typeof content === "string") {
      return content;
    }

    if (content === null || content === undefined) {
      return "";
    }

    return JSON.stringify(content, null, 2);
  }
}
