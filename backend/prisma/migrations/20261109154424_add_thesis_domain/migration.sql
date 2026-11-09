-- CreateEnum
CREATE TYPE "ThesisType" AS ENUM ('KLTN', 'CDTN');

-- CreateEnum
CREATE TYPE "ThesisStatus" AS ENUM ('CHUA_DANG_KY', 'CHO_GVHD_XAC_NHAN', 'CHO_KHOA_GIAO', 'DANG_THUC_HIEN', 'DA_DANH_GIA_GIUA_KY', 'DA_KIEM_TRA_DEMO', 'CHO_DUYET_HO_SO', 'CHO_PHAN_BIEN', 'DU_DIEU_KIEN_BAO_VE', 'DA_BAO_VE', 'DA_LUU_HO_SO', 'KHONG_DU_DIEU_KIEN');

-- CreateEnum
CREATE TYPE "EvaluationResult" AS ENUM ('DAT', 'CANH_BAO', 'KHONG_DAT');

-- CreateEnum
CREATE TYPE "DefenseDecision" AS ENUM ('CHO_BAO_VE', 'KHONG_CHO_BAO_VE');

-- CreateTable
CREATE TABLE "semester_milestones" (
    "id" SERIAL NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semester_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_fields" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_suggestions" (
    "id" SERIAL NOT NULL,
    "lecturerId" INTEGER NOT NULL,
    "fieldId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxSlots" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "semesterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theses" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "supervisorId" INTEGER,
    "fieldId" INTEGER,
    "type" "ThesisType" NOT NULL,
    "status" "ThesisStatus" NOT NULL DEFAULT 'CHUA_DANG_KY',
    "title" TEXT,
    "description" TEXT,
    "outlineUrl" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isEligible" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityNote" TEXT,
    "midtermResult" "EvaluationResult",
    "checkpointResult" "EvaluationResult",
    "decisionCode" TEXT,
    "decisionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "semester_milestones_semesterId_code_key" ON "semester_milestones"("semesterId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "research_fields_name_key" ON "research_fields"("name");

-- CreateIndex
CREATE UNIQUE INDEX "theses_studentId_semesterId_key" ON "theses"("studentId", "semesterId");

-- AddForeignKey
ALTER TABLE "semester_milestones" ADD CONSTRAINT "semester_milestones_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_suggestions" ADD CONSTRAINT "topic_suggestions_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_suggestions" ADD CONSTRAINT "topic_suggestions_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "research_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "lecturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "research_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;
