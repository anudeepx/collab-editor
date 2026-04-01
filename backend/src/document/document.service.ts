import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "../../lib/prisma";
import { CreateDocumentDto } from "./dto/create-document.dto";

type DocumentResponse = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DocumentService {
  async create(dto: CreateDocumentDto): Promise<DocumentResponse> {
    const note = await prisma.note.create({
      data: {
        title: dto.title?.trim() || "Untitled document",
        content: dto.content,
      },
    });

    return this.toDocumentResponse(note);
  }

  async findOne(id: string): Promise<DocumentResponse> {
    const note = await prisma.note.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new NotFoundException(`Document ${id} was not found`);
    }

    return this.toDocumentResponse(note);
  }

  async update(id: string, content: string): Promise<DocumentResponse> {
    await this.findOne(id);

    const note = await prisma.note.update({
      where: { id },
      data: { content },
    });

    return this.toDocumentResponse(note);
  }

  private toDocumentResponse(note: {
    id: string;
    title: string;
    content: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentResponse {
    return {
      id: note.id,
      title: note.title,
      content: this.normalizeContent(note.content),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
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
