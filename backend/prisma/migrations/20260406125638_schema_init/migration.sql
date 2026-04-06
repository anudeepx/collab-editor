-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "currentVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_collaborator" (
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_collaborator_pkey" PRIMARY KEY ("noteId","userId")
);

-- CreateTable
CREATE TABLE "note_version" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changeSummary" TEXT,
    "editedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_updatedAt_id_idx" ON "note"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "note_deletedAt_idx" ON "note"("deletedAt");

-- CreateIndex
CREATE INDEX "note_collaborator_userId_role_idx" ON "note_collaborator"("userId", "role");

-- CreateIndex
CREATE INDEX "note_collaborator_noteId_role_idx" ON "note_collaborator"("noteId", "role");

-- CreateIndex
CREATE INDEX "note_version_noteId_createdAt_idx" ON "note_version"("noteId", "createdAt");

-- CreateIndex
CREATE INDEX "note_version_editedByUserId_createdAt_idx" ON "note_version"("editedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "note_version_noteId_version_key" ON "note_version"("noteId", "version");

-- AddForeignKey
ALTER TABLE "note_collaborator" ADD CONSTRAINT "note_collaborator_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_collaborator" ADD CONSTRAINT "note_collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_version" ADD CONSTRAINT "note_version_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_version" ADD CONSTRAINT "note_version_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
