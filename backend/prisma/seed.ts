import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("1. Seeding roles...");
  const roles = [
    { name: RoleName.ADMIN, description: "Quản trị hệ thống" },
    { name: RoleName.GIAO_VU, description: "Giáo vụ Khoa" },
    { name: RoleName.LANH_DAO, description: "Lãnh đạo Khoa" },
    { name: RoleName.GVHD, description: "Giảng viên hướng dẫn" },
    { name: RoleName.GVPB, description: "Giảng viên phản biện" },
    { name: RoleName.THANH_VIEN_HD, description: "Thành viên Hội đồng" },
    { name: RoleName.THU_KY_HD, description: "Thư ký Hội đồng" },
    { name: RoleName.SINH_VIEN, description: "Sinh viên" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  console.log("2. Seeding admin user...");
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kltn.edu.vn" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@kltn.edu.vn",
      passwordHash: adminPasswordHash,
      fullName: "Quản trị viên",
      status: "ACTIVE",
    },
  });

  const adminRole = await prisma.role.findUnique({
    where: { name: RoleName.ADMIN },
  });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log("3. Seeding active semester...");
  await prisma.semester.updateMany({ data: { isActive: false } });
  const activeSemester = await prisma.semester.upsert({
    where: { code: "SEM2026_HK1" },
    update: { isActive: true },
    create: {
      name: "Học kỳ 1 năm học 2026 - 2027",
      code: "SEM2026_HK1",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-01-15"),
      isActive: true,
    },
  });

  console.log("4. Seeding research fields...");
  const field1 = await prisma.researchField.upsert({
    where: { name: "Công nghệ phần mềm" },
    update: { isActive: true },
    create: {
      name: "Công nghệ phần mềm",
      description: "Phát triển ứng dụng web, di động, DevOps và kiểm thử",
      isActive: true,
    },
  });

  await prisma.researchField.upsert({
    where: { name: "Trí tuệ nhân tạo & Khoa học dữ liệu" },
    update: { isActive: true },
    create: {
      name: "Trí tuệ nhân tạo & Khoa học dữ liệu",
      description: "Machine Learning, Deep Learning, Computer Vision, NLP",
      isActive: true,
    },
  });

  console.log("5. Seeding sample lecturer (GVHD)...");
  const gvhdRole = await prisma.role.findUnique({ where: { name: RoleName.GVHD } });
  const lecturerPassword = await bcrypt.hash("Gvhd@123", 10);
  const lecturerUser = await prisma.user.upsert({
    where: { email: "gvhd@kltn.edu.vn" },
    update: { passwordHash: lecturerPassword },
    create: {
      email: "gvhd@kltn.edu.vn",
      passwordHash: lecturerPassword,
      fullName: "TS. Nguyễn Văn Hướng Dẫn",
      status: "ACTIVE",
    },
  });

  if (gvhdRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: lecturerUser.id, roleId: gvhdRole.id } },
      update: {},
      create: { userId: lecturerUser.id, roleId: gvhdRole.id },
    });
  }

  const lecturer = await prisma.lecturer.upsert({
    where: { userId: lecturerUser.id },
    update: {},
    create: {
      userId: lecturerUser.id,
      staffCode: "GV001",
      degree: "Tiến sĩ",
      department: "Công nghệ phần mềm",
      maxStudents: 5,
    },
  });

  console.log("6. Seeding topic suggestion...");
  await prisma.topicSuggestion.deleteMany({ where: { lecturerId: lecturer.id } });
  await prisma.topicSuggestion.create({
    data: {
      title: "Hệ thống Quản lý Khóa luận Tốt nghiệp thông minh",
      description: "Nghiên cứu kiến trúc Web, Microservices, tích hợp AI hỗ trợ thẩm định",
      lecturerId: lecturer.id,
      fieldId: field1.id,
      semesterId: activeSemester.id,
      maxSlots: 2,
      isPublished: true,
    },
  });

  console.log("7. Seeding sample student...");
  const svRole = await prisma.role.findUnique({ where: { name: RoleName.SINH_VIEN } });
  const studentPassword = await bcrypt.hash("Student@123", 10);
  const studentUser = await prisma.user.upsert({
    where: { email: "student@kltn.edu.vn" },
    update: { passwordHash: studentPassword },
    create: {
      email: "student@kltn.edu.vn",
      passwordHash: studentPassword,
      fullName: "Nguyễn Văn Sinh Viên",
      status: "ACTIVE",
    },
  });

  if (svRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: studentUser.id, roleId: svRole.id } },
      update: {},
      create: { userId: studentUser.id, roleId: svRole.id },
    });
  }

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentCode: "A12345",
      className: "CNTT-K21A",
      cohort: "2021",
      major: "Công nghệ phần mềm",
    },
  });

  console.log("\n========================================================");
  console.log("✓ Seed completed successfully!");
  console.log("Accounts ready for testing:");
  console.log("- Admin:    admin@kltn.edu.vn   / Admin@123");
  console.log("- Giảng viên: gvhd@kltn.edu.vn    / Gvhd@123");
  console.log("- Sinh viên:  student@kltn.edu.vn / Student@123");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
