import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding roles...");

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
      update: {},
      create: role,
    });
  }

  console.log("Seeding admin user...");

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kltn.edu.vn" },
    update: {},
    create: {
      email: "admin@kltn.edu.vn",
      passwordHash,
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

  console.log("Seed completed!");
  console.log("Admin account: admin@kltn.edu.vn / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });