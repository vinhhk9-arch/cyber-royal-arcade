# CYBER ROYAL ARCADE — BẢN GITHUB PAGES

## ĐĂNG LÊN GITHUB TỪ WINDOWS

1. Nhấn chuột phải vào `Cyber_Royal_Arcade_GitHub_Pages.zip` → **Extract All... / Giải nén tất cả**.
2. Vào https://github.com và đăng nhập → **New repository** (tạo kho mới), đặt tên ví dụ `arcade-game`. Chọn **Public** → **Create repository**.
3. Vào repository → **Add file → Upload files**. **Mở thư mục vừa giải nén, chọn tất cả tệp và thư mục `icons` bên trong**, rồi kéo vào trang GitHub (hoặc chọn qua Upload files). **Tệp `index.html` phải nằm ngay ở thư mục gốc repository**, không nằm trong thư mục con.
4. Bấm **Commit changes**.
5. Vào **Settings → Pages → Build and deployment**. Chọn **Deploy from a branch**, Branch **main**, Folder **/(root)** → **Save**.
6. Mở đường dẫn GitHub Pages hiển thị, thường là `https://TEN-TAI-KHOAN.github.io/arcade-game/`.

### Sử dụng trên các thiết bị

- **PC**: Bấm `Vào chơi`, dùng chuột và bàn phím trong game bắn cá. Nút **⛶ Phóng to** bật hoặc tắt toàn màn hình.
- **Android**: Mở link trong Chrome, chạm màn hình để chơi. Có thể quay ngang máy hoặc để dọc (khung bắn cá sẽ xoay ngang tự động). Nút **⛶ Phóng to** bật toàn màn hình khi được trình duyệt cho phép.
- **iPhone**: Mở link trong Safari. Vì Safari iPhone **không hỗ trợ ép một trang web bình thường vào toàn màn hình**, hãy bấm nút **Chia sẻ → Thêm vào Màn hình chính → Thêm**; rồi mở game bằng biểu tượng mới để có chế độ toàn màn hình không có thanh Safari. Phần bắn cá sẽ tự xoay khung khi điện thoại dọc.

### Lưu ý

- Trang web là game tĩnh, **không cần server hay database**. Ví xu lưu trong trình duyệt (`localStorage`) và dùng chung các game trên **cùng thiết bị/cùng trình duyệt**, không đồng bộ giữa hai điện thoại hoặc hai máy tính.
- Khi chơi lần đầu, cần kết nối Internet để mở trang. Các file trò chơi được cache để hỗ trợ truy cập lại ngoại tuyến trong nhiều trường hợp; font Google có thể dùng font dự phòng khi offline.
- Game dùng xu ảo nội bộ, không có hệ thống tài khoản hay tiền thật.
- Nếu bạn cập nhật file lên GitHub, hãy tải lại trang; nếu máy vẫn dùng bản cũ, hãy đóng webapp và mở lại hoặc xóa dữ liệu website.
- GitHub Pages có thể mất một lúc để xuất bản lần đầu; xem thông báo tại **Settings → Pages**.
