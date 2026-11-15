-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CHANGE_TOPIC', 'CHANGE_SUPERVISOR', 'BOTH');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('CHO_DUYET', 'DA_DUYET', 'YEU_CAU_CHINH_SUA', 'BI_LOAI');

-- CreateEnum
CREATE TYPE "CouncilRole" AS ENUM ('CHU_TICH', 'THU_KY', 'UY_VIEN');

-- CreateEnum
CREATE TYPE "CouncilStatus" AS ENUM ('CHUAN_BI', 'DANG_DIEN_RA', 'DA_KET_THUC');

-- CreateTable
CREATE TABLE "thesis_change_requests" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "newTitle" TEXT,
    "newDescription" TEXT,
    "newSupervisorId" INTEGER,
    "reason" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "reviewedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thesis_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_logs" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "tasksAssigned" TEXT,
    "studentNotes" TEXT,
    "isConfirmedByStudent" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "progressPercentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midterm_evaluations" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "reportFileUrl" TEXT,
    "submittedAt" TIMESTAMP(3),
    "comments" TEXT,
    "result" "EvaluationResult",
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "midterm_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoint_demos" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "demoDate" TIMESTAMP(3),
    "location" TEXT,
    "comments" TEXT,
    "result" "EvaluationResult",
    "canDefend" BOOLEAN NOT NULL DEFAULT true,
    "disqualifiedRecordUrl" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkpoint_demos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defense_submissions" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "reportFileUrl" TEXT NOT NULL,
    "sourceCodeUrl" TEXT NOT NULL,
    "plagiarismRate" DOUBLE PRECISION NOT NULL,
    "plagiarismFileUrl" TEXT,
    "supervisorDecision" "DefenseDecision",
    "supervisorComments" TEXT,
    "supervisorScore" DOUBLE PRECISION,
    "supervisorSignedAt" TIMESTAMP(3),
    "hardCopyReceived" BOOLEAN NOT NULL DEFAULT false,
    "hardCopyReceivedAt" TIMESTAMP(3),
    "facultyApprovalStatus" "ApprovalStatus" NOT NULL DEFAULT 'CHO_DUYET',
    "facultyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defense_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_assignments" (
    "id" SERIAL NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preliminaryNotes" TEXT,
    "detailedReview" TEXT,
    "decision" "DefenseDecision",
    "reviewerScore" DOUBLE PRECISION,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defense_councils" (
    "id" SERIAL NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defenseDate" TIMESTAMP(3),
    "location" TEXT,
    "status" "CouncilStatus" NOT NULL DEFAULT 'CHUAN_BI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defense_councils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "council_members" (
    "id" SERIAL NOT NULL,
    "councilId" INTEGER NOT NULL,
    "lecturerId" INTEGER NOT NULL,
    "role" "CouncilRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "council_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "council_thesis_assignments" (
    "id" SERIAL NOT NULL,
    "councilId" INTEGER NOT NULL,
    "thesisId" INTEGER NOT NULL,
    "orderNumber" INTEGER,
    "scheduledTime" TIMESTAMP(3),
    "councilScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "minuteNotes" TEXT,
    "minuteFileUrl" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "council_thesis_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "council_scores" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "lecturerId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "council_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "midterm_evaluations_thesisId_key" ON "midterm_evaluations"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoint_demos_thesisId_key" ON "checkpoint_demos"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "defense_submissions_thesisId_key" ON "defense_submissions"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_assignments_thesisId_key" ON "reviewer_assignments"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "council_members_councilId_lecturerId_key" ON "council_members"("councilId", "lecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "council_thesis_assignments_thesisId_key" ON "council_thesis_assignments"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "council_scores_assignmentId_lecturerId_key" ON "council_scores"("assignmentId", "lecturerId");

-- AddForeignKey
ALTER TABLE "thesis_change_requests" ADD CONSTRAINT "thesis_change_requests_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_change_requests" ADD CONSTRAINT "thesis_change_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_change_requests" ADD CONSTRAINT "thesis_change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_change_requests" ADD CONSTRAINT "thesis_change_requests_newSupervisorId_fkey" FOREIGN KEY ("newSupervisorId") REFERENCES "lecturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_logs" ADD CONSTRAINT "supervision_logs_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "midterm_evaluations" ADD CONSTRAINT "midterm_evaluations_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_demos" ADD CONSTRAINT "checkpoint_demos_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defense_submissions" ADD CONSTRAINT "defense_submissions_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defense_councils" ADD CONSTRAINT "defense_councils_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_members" ADD CONSTRAINT "council_members_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "defense_councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_members" ADD CONSTRAINT "council_members_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_thesis_assignments" ADD CONSTRAINT "council_thesis_assignments_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "defense_councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_thesis_assignments" ADD CONSTRAINT "council_thesis_assignments_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_scores" ADD CONSTRAINT "council_scores_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "council_thesis_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_scores" ADD CONSTRAINT "council_scores_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
