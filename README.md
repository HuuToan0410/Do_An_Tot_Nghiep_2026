# 🚗 AUTO Leng Art - Used Car E-Commerce & ERP System

AUTO Leng Art là hệ thống thương mại điện tử kết hợp quản trị nội bộ (ERP) chuyên biệt dành cho lĩnh vực kinh doanh ô tô đã qua sử dụng. Dự án cung cấp giải pháp số hóa toàn diện vòng đời của một chiếc xe, từ khâu thu mua, kiểm định chất lượng, tân trang, định giá cho đến niêm yết bán hàng và bảo hành. Hệ thống được thiết kế theo kiến trúc Client-Server phân tách hoàn toàn, bao gồm 26 giao diện riêng biệt cho nền tảng bán hàng (Front-end) và hệ thống quản trị (Back-office).

---

## 🛠 Tech Stack

| Thành phần | Công nghệ |
| :--- | :--- |
| **Front-end** | ReactJS, TypeScript, Tailwind CSS |
| **State Management** | Zustand, React Query |
| **Back-end** | Python, Django, Django REST Framework (DRF) |
| **Database** | PostgreSQL |
| **Payment Gateway** | MoMo API (Webhook IPN) |

---

## 🔥 Giải pháp Kỹ thuật Nổi bật

- **Quản lý luồng dữ liệu nghiêm ngặt (State Machine):** Ứng dụng mô hình máy trạng thái đơn hướng tại tầng Backend để kiểm soát 11 giai đoạn trong vòng đời xe (Thu mua → Kiểm định → Tân trang → Niêm yết → Bán hàng). Đảm bảo quy trình nghiệp vụ được thực hiện đúng thứ tự và không bỏ qua các bước kiểm soát chất lượng.

- **Xử lý tương tranh (Concurrency Control):** Thiết kế cơ chế khóa xe tự động tại Backend nhằm xử lý xung đột khi nhiều người dùng cùng lúc thực hiện thanh toán đặt cọc, ngăn chặn tình trạng một xe được đặt bởi nhiều khách hàng.

- **Thuật toán chống Spam kép:** Bảo vệ quy trình đặt lịch hẹn bằng cách kết hợp giới hạn tần suất truy cập (Rate Limiting) và kiểm tra xung đột thời gian (±30 phút), giúp hạn chế bot và đảm bảo tính chính xác của dữ liệu.

- **Phân quyền bảo mật (RBAC):** Xây dựng hệ thống phân quyền dựa trên JWT cho 7 nhóm vai trò gồm Quản trị viên, Thu mua, Kiểm định, Kỹ thuật, Định giá, Bán hàng và Khách hàng, đảm bảo quyền truy cập phù hợp với từng bộ phận.

- **Tích hợp thanh toán thời gian thực:** Kết nối ví điện tử MoMo thông qua Webhook IPN để xử lý giao dịch đặt cọc giữ xe theo thời gian thực.

- **Data Seeding & Performance Testing:** Xây dựng kịch bản bằng Python và Faker để tự động sinh hơn 200 hồ sơ xe cùng dữ liệu giao dịch ngẫu nhiên trong 24 tháng, phục vụ kiểm thử hiệu năng của hệ thống Dashboard.

---

## 🌟 Tính năng Chính

### 🛍 Phân hệ Khách hàng (B2C)

- **Tìm kiếm và lọc nâng cao:** Tra cứu xe theo hãng, mức giá, năm sản xuất và kiểu dáng.
- **Minh bạch chất lượng:** Xem chi tiết thông số kỹ thuật cùng báo cáo kiểm định trực tuyến.
- **Giao dịch trực tuyến:** Đặt lịch hẹn xem xe và thanh toán đặt cọc qua MoMo.
- **Cá nhân hóa trải nghiệm:** So sánh xe, quản lý danh sách yêu thích và theo dõi lịch sử giao dịch.

### 🏢 Phân hệ Quản trị (Back-office / ERP)

- **Quản lý chuỗi cung ứng:** Quản lý hồ sơ thu mua, kiểm định, tân trang và cập nhật chi phí sửa chữa.
- **Định giá và niêm yết:** Tính toán giá bán dựa trên tổng chi phí thu mua và tân trang để hỗ trợ phê duyệt niêm yết.
- **Quản lý bán hàng (Sales & CRM):** Xử lý khách hàng tiềm năng (Lead), xác nhận đơn bán, lập biên bản bàn giao và tạo sổ bảo hành điện tử.
- **Báo cáo thống kê:** Dashboard theo dõi doanh thu, lợi nhuận và số lượng xe tồn kho theo thời gian thực.

---

## 🚀 Cài đặt & Khởi chạy (Local Development)

### Backend (Django)

> Hướng dẫn cài đặt sẽ được cập nhật.

### Frontend (React)

> Hướng dẫn cài đặt sẽ được cập nhật.

---

## 👨‍💻 Tác giả

**Hứa Hữu Toàn**  
Full-stack Developer

Khóa luận tốt nghiệp ngành **Kỹ thuật Công nghệ Thông tin**  
Trường Đại học Nguyễn Tất Thành.
