import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma.js";

export async function getDashboardStats(semesterId?: number) {
  const whereSemester = semesterId ? { semesterId } : {};

  // 1. Tổng số đề tài
  const totalTheses = await prisma.thesis.count({ where: whereSemester });

  // 2. Theo loại hình (KLTN / CDTN)
  const kltnCount = await prisma.thesis.count({
    where: { ...whereSemester, type: "KLTN" },
  });
  const cdtnCount = await prisma.thesis.count({
    where: { ...whereSemester, type: "CDTN" },
  });

  // 3. Theo trạng thái
  const statuses = [
    "CHUA_DANG_KY",
    "CHO_GVHD_XAC_NHAN",
    "CHO_KHOA_GIAO",
    "DANG_THUC_HIEN",
    "DA_DANH_GIA_GIUA_KY",
    "DA_KIEM_TRA_DEMO",
    "CHO_DUYET_HO_SO",
    "CHO_PHAN_BIEN",
    "DU_DIEU_KIEN_BAO_VE",
    "DA_BAO_VE",
    "DA_LUU_HO_SO",
    "KHONG_DU_DIEU_KIEN",
  ];

  const statusCounts: Record<string, number> = {};
  for (const s of statuses) {
    statusCounts[s] = await prisma.thesis.count({
      where: { ...whereSemester, status: s as any },
    });
  }

  // 4. Kết quả giữa kỳ
  const midtermDat = await prisma.thesis.count({
    where: { ...whereSemester, midtermResult: "DAT" },
  });
  const midtermCanhBao = await prisma.thesis.count({
    where: { ...whereSemester, midtermResult: "CANH_BAO" },
  });
  const midtermKhongDat = await prisma.thesis.count({
    where: { ...whereSemester, midtermResult: "KHONG_DAT" },
  });

  // 5. Thống kê theo Lĩnh vực nghiên cứu
  const fields = await prisma.researchField.findMany({
    include: {
      _count: {
        select: {
          theses: { where: whereSemester },
        },
      },
    },
  });

  const fieldStats = fields.map((f) => ({
    id: f.id,
    name: f.name,
    _count: { theses: f._count.theses },
    fieldId: f.id,
    fieldName: f.name,
    thesisCount: f._count.theses,
  }));

  // 6. Điểm trung bình bảo vệ (các đề tài đã có finalScore)
  const completedAssignments = await prisma.councilThesisAssignment.findMany({
    where: {
      finalScore: { not: null },
      ...(semesterId ? { thesis: { semesterId } } : {}),
    },
    select: { finalScore: true },
  });

  const avgFinalScore =
    completedAssignments.length > 0
      ? Number(
          (
            completedAssignments.reduce(
              (acc, cur) => acc + (cur.finalScore || 0),
              0,
            ) / completedAssignments.length
          ).toFixed(2),
        )
      : null;

  return {
    totalTheses,
    kltnCount,
    cdtnCount,
    statusCounts,
    midtermDat,
    midtermCanhBao,
    midtermKhongDat,
    byType: {
      KLTN: kltnCount,
      CDTN: cdtnCount,
    },
    byStatus: statusCounts,
    midterm: {
      DAT: midtermDat,
      CANH_BAO: midtermCanhBao,
      KHONG_DAT: midtermKhongDat,
    },
    fields: fieldStats,
    completedDefenseCount: completedAssignments.length,
    avgFinalScore,
  };
}

export async function generateThesesExcel(semesterId?: number) {
  const whereSemester = semesterId ? { semesterId } : {};

  const theses = await prisma.thesis.findMany({
    where: whereSemester,
    orderBy: { id: "asc" },
    include: {
      student: {
        include: { user: true },
      },
      supervisor: {
        include: { user: true },
      },
      field: true,
      semester: true,
      defenseSubmission: true,
      reviewerAssignment: {
        include: { reviewer: { include: { user: true } } },
      },
      councilAssignment: true,
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hệ thống Quản lý KLTN - Khoa CNTT";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Danh sách Khóa luận");

  // Định nghĩa cột
  worksheet.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã ĐT", key: "id", width: 10 },
    { header: "MSSV", key: "studentCode", width: 15 },
    { header: "Họ và tên Sinh viên", key: "studentName", width: 25 },
    { header: "Lớp", key: "className", width: 15 },
    { header: "Loại", key: "type", width: 10 },
    { header: "Tên đề tài", key: "title", width: 40 },
    { header: "Lĩnh vực", key: "fieldName", width: 20 },
    { header: "GVHD", key: "supervisorName", width: 25 },
    { header: "GVPB", key: "reviewerName", width: 25 },
    { header: "Trạng thái", key: "status", width: 25 },
    { header: "Đạo văn (%)", key: "plagiarismRate", width: 15 },
    { header: "Điểm GVHD", key: "gvhdScore", width: 14 },
    { header: "Điểm GVPB", key: "gvpbScore", width: 14 },
    { header: "Điểm HĐ", key: "councilScore", width: 14 },
    { header: "Điểm Tổng kết", key: "finalScore", width: 16 },
  ];

  // Header style
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // Màu xanh navy Khoa
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Ghi dữ liệu
  theses.forEach((t, index) => {
    const row = worksheet.addRow({
      stt: index + 1,
      id: t.id,
      studentCode: t.student.studentCode,
      studentName: t.student.user.fullName,
      className: t.student.className || "",
      type: t.type,
      title: t.title || "Chưa đặt tên đề tài",
      fieldName: t.field?.name || "Chưa phân",
      supervisorName: t.supervisor?.user.fullName || "Chưa có",
      reviewerName:
        t.reviewerAssignment?.reviewer.user.fullName || "Chưa phân công",
      status: t.status,
      plagiarismRate: t.defenseSubmission?.plagiarismRate ?? "",
      gvhdScore: t.defenseSubmission?.supervisorScore ?? "",
      gvpbScore: t.reviewerAssignment?.reviewerScore ?? "",
      councilScore: t.councilAssignment?.councilScore ?? "",
      finalScore: t.councilAssignment?.finalScore ?? "",
    });

    row.height = 22;
    row.alignment = { vertical: "middle" };

    // Kẻ viền cho từng ô
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if ([1, 2, 3, 5, 6, 12, 13, 14, 15, 16].includes(colNumber)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  });

  return workbook.xlsx.writeBuffer();
}
