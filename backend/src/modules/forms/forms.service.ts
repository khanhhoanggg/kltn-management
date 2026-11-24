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
            <strong>TRƯỜNG ĐẠI HỌC THĂNG LONG</strong><br />
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

    case "BM02":
      title = "BM-02: BẢN ĐỀ CƯƠNG CHI TIẾT KHÓA LUẬN / CHUYÊN ĐỀ TỐT NGHIỆP";
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p><strong>1. Thông tin chung:</strong></p>
        <ul>
          <li>Họ và tên sinh viên: <strong>${thesis.student.user.fullName}</strong> - MSSV: <strong>${thesis.student.studentCode}</strong></li>
          <li>Lớp: ${thesis.student.className || "..."} - Ngành: ${thesis.student.major || "..."}</li>
          <li>Giảng viên hướng dẫn: <strong>${thesis.supervisor?.user.fullName || "Chưa có"}</strong> (${thesis.supervisor?.degree || ""})</li>
          <li>Tên đề tài: <strong>${thesis.title || "Chưa đăng ký"}</strong></li>
          <li>Loại hình: <strong>${thesis.type === "KLTN" ? "Khóa luận tốt nghiệp" : "Chuyên đề tốt nghiệp"}</strong> - Chuyên ngành: <strong>${thesis.field?.name || "Chưa phân"}</strong></li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>2. Nội dung đề cương chi tiết:</strong></p>
        <p><strong>2.1. Tính cấp thiết và Mục tiêu đề tài:</strong></p>
        <p style="margin-left: 20px;">${thesis.description || "Chưa có mô tả tóm tắt"}</p>
        <p><strong>2.2. Nhiệm vụ và Phạm vi nghiên cứu:</strong></p>
        <p style="margin-left: 20px;">- Nghiên cứu cơ sở lý thuyết và công nghệ liên quan.<br />- Phân tích yêu cầu, thiết kế kiến trúc hệ thống.<br />- Xây dựng sản phẩm thử nghiệm đạt chuẩn demo.</p>
        <p><strong>2.3. Kế hoạch và Tiến độ dự kiến (16 tuần):</strong></p>
        <ul style="margin-left: 20px;">
          <li>Tuần 1 - 2: Đăng ký đề tài, duyệt đề cương chi tiết (BM-01, BM-02).</li>
          <li>Tuần 3 - 6: Nghiên cứu tài liệu, phân tích yêu cầu và thiết kế hệ thống.</li>
          <li>Tuần 7: Báo cáo tiến độ giữa kỳ (BM-03) đạt ≥ 40% khối lượng.</li>
          <li>Tuần 8 - 10: Lập trình, hoàn thiện chức năng và kiểm thử.</li>
          <li>Tuần 11: Kiểm tra Demo Check-point (BM-03) đạt ≥ 70% khối lượng.</li>
          <li>Tuần 12 - 14: Viết báo cáo toàn văn, kiểm tra đạo văn (&lt; 20%) và nộp hồ sơ bảo vệ (BM-04).</li>
          <li>Tuần 15 - 16: Phản biện và bảo vệ trước Hội đồng chấm khóa luận.</li>
        </ul>
        <p><strong>2.4. File đính kèm đề cương chi tiết:</strong></p>
        <p style="margin-left: 20px;">${thesis.outlineUrl ? `<a href="${thesis.outlineUrl}" target="_blank">${thesis.outlineUrl}</a>` : "Chưa cập nhật link file đề cương"}</p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <strong>Giảng viên hướng dẫn</strong><br />
              <em>(Ký và ghi rõ họ tên)</em><br /><br /><br /><br />
              <strong>${thesis.supervisor?.user.fullName || "...................................."}</strong>
            </td>
            <td style="width: 50%; text-align: center;">
              <em>Ngày ..... tháng ..... năm 202...</em><br />
              <strong>Sinh viên thực hiện</strong><br />
              <em>(Ký và ghi rõ họ tên)</em><br /><br /><br /><br />
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

    case "BM04":
      title = "BM-04: PHIẾU ĐĂNG KÝ BẢO VỆ KHÓA LUẬN / CHUYÊN ĐỀ TỐT NGHIỆP";
      body = `
        <h2 style="text-align: center; margin: 20px 0;">${title}</h2>
        <p><strong>1. Thông tin sinh viên & đề tài:</strong></p>
        <ul>
          <li>Sinh viên: <strong>${thesis.student.user.fullName}</strong> - MSSV: <strong>${thesis.student.studentCode}</strong></li>
          <li>Lớp: ${thesis.student.className || "..."} - Ngành: ${thesis.student.major || "..."}</li>
          <li>Đề tài: <strong>${thesis.title || "Chưa có"}</strong></li>
          <li>GVHD: <strong>${thesis.supervisor?.user.fullName || "Chưa có"}</strong></li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>2. Kết quả quá trình thực hiện:</strong></p>
        <ul>
          <li>Đánh giá giữa kỳ (Tuần 7): <strong>${thesis.midtermEvaluation?.result || "Chưa đánh giá"}</strong></li>
          <li>Kiểm tra Demo Check-point (Tuần 11): <strong>${thesis.checkpointDemo?.result || "Chưa kiểm tra"}</strong> (${thesis.checkpointDemo?.canDefend ? "Đủ điều kiện" : "Không đủ điều kiện"})</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>3. Hồ sơ bảo vệ đã nộp:</strong></p>
        <ul>
          <li>File Báo cáo toàn văn: ${thesis.defenseSubmission?.reportFileUrl ? `<a href="${thesis.defenseSubmission.reportFileUrl}">Đã nộp</a>` : "Chưa nộp"}</li>
          <li>File Slide thuyết trình: ${thesis.defenseSubmission?.slideFileUrl ? `<a href="${thesis.defenseSubmission.slideFileUrl}">Đã nộp</a>` : "Chưa nộp"}</li>
          <li>Link mã nguồn: ${thesis.defenseSubmission?.sourceCodeUrl ? `<a href="${thesis.defenseSubmission.sourceCodeUrl}" target="_blank">${thesis.defenseSubmission.sourceCodeUrl}</a>` : "Chưa có"}</li>
          <li>Tỷ lệ trùng lặp đạo văn: <strong style="color: ${Number(thesis.defenseSubmission?.plagiarismRate ?? 0) < 20 ? "#16a34a" : "#dc2626"};">${thesis.defenseSubmission?.plagiarismRate ?? "..."}%</strong> (Quy định: &lt; 20%)</li>
          <li>Tình trạng nhận bản cứng tại Khoa: <strong>${thesis.defenseSubmission?.hardCopyReceived ? "ĐÃ TIẾP NHẬN BẢN CỨNG" : "CHƯA NỘP BẢN CỨNG"}</strong></li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />
        <p><strong>4. Ý kiến xác nhận của GVHD:</strong></p>
        <p>- Quyết định: <strong>${thesis.defenseSubmission?.supervisorDecision === "CHO_BAO_VE" ? "ĐỒNG Ý CHO BẢO VỆ" : thesis.defenseSubmission?.supervisorDecision === "KHONG_CHO_BAO_VE" ? "KHÔNG CHO BẢO VỆ" : "Chưa đánh giá"}</strong></p>
        <p>- Nhận xét: ${thesis.defenseSubmission?.supervisorComments || "Chưa có nhận xét"}</p>
        <p>- Điểm GVHD: <strong>${thesis.defenseSubmission?.supervisorScore ?? "..."}</strong> / 10</p>
        <table style="width: 100%; margin-top: 40px;">
          <tr>
            <td style="width: 33%; text-align: center; vertical-align: top;">
              <strong>Sinh viên</strong><br /><br /><br /><br />
              <strong>${thesis.student.user.fullName}</strong>
            </td>
            <td style="width: 33%; text-align: center; vertical-align: top;">
              <strong>Giảng viên hướng dẫn</strong><br /><br /><br /><br />
              <strong>${thesis.supervisor?.user.fullName || "................................"}</strong>
            </td>
            <td style="width: 34%; text-align: center; vertical-align: top;">
              <em>Ngày ..... tháng ..... năm 202...</em><br />
              <strong>Giáo vụ Khoa xác nhận</strong><br /><br /><br /><br />
              ................................................
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
