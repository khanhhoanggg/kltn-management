import { prisma } from "../../lib/prisma.js";

export async function getFormData(thesisId: number, formCode: string) {
  const code = formCode.toUpperCase().replace("-", "");

  const thesis = await prisma.thesis.findUnique({
    where: { id: thesisId },
    include: {
      student: {
        include: { user: true },
      },
      supervisor: {
        include: { user: true },
      },
      field: true,
      semester: true,
      midtermEvaluation: true,
      checkpointDemo: true,
      defenseSubmission: true,
      reviewerAssignment: {
        include: { reviewer: { include: { user: true } } },
      },
      councilAssignment: {
        include: {
          council: {
            include: {
              members: {
                include: { lecturer: { include: { user: true } } },
              },
            },
          },
          scores: {
            include: { lecturer: { include: { user: true } } },
          },
        },
      },
    },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  const baseHeader = `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; color: #000;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="text-align: center; vertical-align: top; width: 45%;">
            <strong>TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN</strong><br />
            <strong>KHOA CÔNG NGHỆ THÔNG TIN</strong><br />
            -----------------------
          </td>
          <td style="text-align: center; vertical-align: top; width: 55%;">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
            <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
            -----------------------------------
          </td>
        </tr>
      </table>
  `;

  const baseFooter = `
    </div>
  `;

  let title = "";
  let body = "";

  switch (code) {
    case "BM01":
      title = "BM-01: PHIẾU ĐĂNG KÝ ĐỀ TÀI KHÓA LUẬN / CHUYÊN ĐỀ TỐT NGHIỆP";
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p><strong>1. Thông tin sinh viên:</strong></p>
        <ul>
          <li>Họ và tên: <strong>${thesis.student.user.fullName}</strong> - MSSV: <strong>${thesis.student.studentCode}</strong></li>
          <li>Lớp: ${thesis.student.className || "..."} - Khóa: ${thesis.student.cohort || "..."} - Ngành: ${thesis.student.major || "..."}</li>
          <li>Email: ${thesis.student.user.email} - SĐT: ${thesis.student.user.phone || "..."}</li>
        </ul>
        <p><strong>2. Thông tin đăng ký đề tài:</strong></p>
        <ul>
          <li>Loại hình: <strong>${thesis.type}</strong> (${thesis.type === "KLTN" ? "Khóa luận tốt nghiệp" : "Chuyên đề tốt nghiệp"})</li>
          <li>Tên đề tài: <strong>${thesis.title || "Chưa đăng ký"}</strong></li>
          <li>Lĩnh vực nghiên cứu: ${thesis.field?.name || "Chưa xác định"}</li>
          <li>Giảng viên hướng dẫn đề xuất: <strong>${thesis.supervisor?.user.fullName || "Chưa có"}</strong> (${thesis.supervisor?.degree || ""})</li>
          <li>Tóm tắt nội dung: ${thesis.description || "Chưa có"}</li>
        </ul>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;"></td>
            <td style="width: 50%; text-align: center;">
              <em>Ngày ..... tháng ..... năm 202...</em><br />
              <strong>Sinh viên đăng ký</strong><br /><br /><br /><br />
              <strong>${thesis.student.user.fullName}</strong>
            </td>
          </tr>
        </table>
      `;
      break;

    case "BM03":
      title = "BM-03: PHIẾU ĐÁNH GIÁ TIẾN ĐỘ GIỮA KỲ VÀ CHECK-POINT DEMO";
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p>Đề tài: <strong>${thesis.title}</strong></p>
        <p>Sinh viên: <strong>${thesis.student.user.fullName}</strong> - MSSV: <strong>${thesis.student.studentCode}</strong></p>
        <p>GVHD: <strong>${thesis.supervisor?.user.fullName}</strong></p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>I. ĐÁNH GIÁ TIẾN ĐỘ GIỮA KỲ:</strong></p>
        <p>Kết quả: <strong>${thesis.midtermEvaluation?.result || "Chưa đánh giá"}</strong></p>
        <p>Nhận xét của GVHD: ${thesis.midtermEvaluation?.comments || "Chưa có"}</p>
        <p><strong>II. KIỂM TRA CHECK-POINT DEMO:</strong></p>
        <p>Kết quả Demo: <strong>${thesis.checkpointDemo?.result || "Chưa kiểm tra"}</strong></p>
        <p>Kết luận bảo vệ: <strong>${thesis.checkpointDemo?.canDefend ? "ĐƯỢC PHÉP BẢO VỆ" : "KHÔNG CHO PHÉP BẢO VỆ"}</strong></p>
        <p>Ý kiến đánh giá Demo: ${thesis.checkpointDemo?.comments || "Chưa có"}</p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;"></td>
            <td style="width: 50%; text-align: center;">
              <em>Ngày ..... tháng ..... năm 202...</em><br />
              <strong>Giảng viên hướng dẫn</strong><br /><br /><br /><br />
              <strong>${thesis.supervisor?.user.fullName}</strong>
            </td>
          </tr>
        </table>
      `;
      break;

    case "BM05":
      title = "BM-05: PHIẾU NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN";
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p>Tên đề tài: <strong>${thesis.title}</strong></p>
        <p>Sinh viên thực hiện: <strong>${thesis.student.user.fullName}</strong> (MSSV: ${thesis.student.studentCode})</p>
        <p>Giảng viên hướng dẫn: <strong>${thesis.supervisor?.user.fullName}</strong></p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>1. Nhận xét về tinh thần, thái độ và kết quả thực hiện:</strong></p>
        <p>${thesis.defenseSubmission?.supervisorComments || "Chưa có nhận xét"}</p>
        <p><strong>2. Điểm đánh giá của GVHD:</strong> <strong style="font-size: 16pt; color: #b91c1c;">${thesis.defenseSubmission?.supervisorScore ?? "..."}</strong> / 10</p>
        <p><strong>3. Quyết định:</strong> <strong>${thesis.defenseSubmission?.supervisorDecision === "CHO_BAO_VE" ? "ĐỒNG Ý CHO BẢO VỆ" : "KHÔNG ĐỒNG Ý CHO BẢO VỆ"}</strong></p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;"></td>
            <td style="width: 50%; text-align: center;">
              <em>Ngày ..... tháng ..... năm 202...</em><br />
              <strong>Giảng viên hướng dẫn</strong><br /><br /><br /><br />
              <strong>${thesis.supervisor?.user.fullName}</strong>
            </td>
          </tr>
        </table>
      `;
      break;

    case "BM06":
      title = "BM-06: PHIẾU NHẬN XÉT CỦA GIẢNG VIÊN PHẢN BIỆN";
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p>Tên đề tài: <strong>${thesis.title}</strong></p>
        <p>Sinh viên thực hiện: <strong>${thesis.student.user.fullName}</strong> (MSSV: ${thesis.student.studentCode})</p>
        <p>Giảng viên phản biện: <strong>${thesis.reviewerAssignment?.reviewer.user.fullName || "Chưa phân công"}</strong></p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>1. Góp ý sơ bộ:</strong></p>
        <p>${thesis.reviewerAssignment?.preliminaryNotes || "Không có"}</p>
        <p><strong>2. Nhận xét chi tiết về đề tài:</strong></p>
        <p>${thesis.reviewerAssignment?.detailedReview || "Chưa có nhận xét chi tiết"}</p>
        <p><strong>3. Điểm phản biện:</strong> <strong style="font-size: 16pt; color: #b91c1c;">${thesis.reviewerAssignment?.reviewerScore ?? "..."}</strong> / 10</p>
        <p><strong>4. Quyết định:</strong> <strong>${thesis.reviewerAssignment?.decision === "CHO_BAO_VE" ? "ĐỦ ĐIỀU KIỆN BẢO VỆ TRƯỚC HỘI ĐỒNG" : "KHÔNG CHO PHÉP BẢO VỆ"}</strong></p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;"></td>
            <td style="width: 50%; text-align: center;">
              <em>Ngày ..... tháng ..... năm 202...</em><br />
              <strong>Giảng viên phản biện</strong><br /><br /><br /><br />
              <strong>${thesis.reviewerAssignment?.reviewer.user.fullName || "..."}</strong>
            </td>
          </tr>
        </table>
      `;
      break;

    case "BM07":
      title = "BM-07: BIÊN BẢN VÀ PHIẾU CHẤM ĐIỂM HỘI ĐỒNG BẢO VỆ";
      const scoresList =
        thesis.councilAssignment?.scores.map(
          (s) =>
            `<li>${s.lecturer.user.fullName}: <strong>${s.score}</strong> điểm ${s.comments ? `(${s.comments})` : ""}</li>`,
        ).join("") || "<li>Chưa có điểm thành viên</li>";

      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p>Hội đồng: <strong>${thesis.councilAssignment?.council.name || "Chưa xếp HĐ"}</strong> (Mã HĐ: ${thesis.councilAssignment?.council.code || "..."})</p>
        <p>Đề tài: <strong>${thesis.title}</strong></p>
        <p>Sinh viên: <strong>${thesis.student.user.fullName}</strong> - MSSV: <strong>${thesis.student.studentCode}</strong></p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>1. Điểm chấm của các thành viên Hội đồng:</strong></p>
        <ul>${scoresList}</ul>
        <p><strong>Điểm trung bình Hội đồng:</strong> <strong>${thesis.councilAssignment?.councilScore ?? "..."}</strong></p>
        <p><strong>2. Ý kiến nhận xét chung của Hội đồng:</strong></p>
        <p>${thesis.councilAssignment?.minuteNotes || "Chưa có ghi chép"}</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p style="font-size: 14pt;"><strong>3. TỔNG KẾT ĐIỂM KHÓA LUẬN / CHUYÊN ĐỀ:</strong></p>
        <p>• Điểm GVHD (30%): <strong>${thesis.defenseSubmission?.supervisorScore ?? 0}</strong></p>
        <p>• Điểm GVPB (20%): <strong>${thesis.reviewerAssignment?.reviewerScore ?? 0}</strong></p>
        <p>• Điểm Hội đồng (50%): <strong>${thesis.councilAssignment?.councilScore ?? 0}</strong></p>
        <p style="font-size: 16pt; color: #1e3a8a;"><strong>• ĐIỂM TỔNG KẾT CHÍNH THỨC: ${thesis.councilAssignment?.finalScore ?? "Chưa tổng kết"}</strong></p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <strong>Thư ký Hội đồng</strong><br /><br /><br /><br />
              .............................................
            </td>
            <td style="width: 50%; text-align: center;">
              <strong>Chủ tịch Hội đồng</strong><br /><br /><br /><br />
              .............................................
            </td>
          </tr>
        </table>
      `;
      break;

    default:
      title = `BIỂU MẪU ${formCode.toUpperCase()}`;
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p>Tên đề tài: <strong>${thesis.title || "Chưa có"}</strong></p>
        <p>Sinh viên: <strong>${thesis.student.user.fullName}</strong> (${thesis.student.studentCode})</p>
        <p>Trạng thái hiện tại: <strong>${thesis.status}</strong></p>
      `;
  }

  const html = `${baseHeader}${body}${baseFooter}`;
  return { thesisId, formCode, title, html };
}
