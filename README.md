# Kỷ niệm 4 năm bên nhau

Trang kỷ niệm mở từ một phong bì giấy, rồi hé lộ sân khấu ảnh thủ công. Sân khấu kết thúc bằng ảnh thật, không còn phong bì; bên dưới là album, lá thư và thiệp gấp.

## Chạy local

```powershell
npm install
npm run dev
```

Mở http://localhost:3000.

## Video mở màn

Các tệp GIF, WebM, MP4 và ảnh sân khấu cuối nằm trong `public/media/`. Phong bì mở một lần sau khi được bấm; lời mời cuộn xuống hiện sau sự kiện video kết thúc.

## Thêm ảnh

20 ảnh đã được nối vào album. Giữ nguyên tên tệp hiện tại trong `public/img/`. Khung nào chưa có ảnh sẽ hiện phần chờ ảnh.

Nội dung nằm trong `config/anniversary.ts`. Ảnh mới có thể được thêm vào cấu hình tại đó.

## Kiểu chữ

Trang dùng Macintosh Skeletal Filled Regular. WOFF2 đầy đủ glyph và OpenType tables được chuyển từ [bản static upstream](https://github.com/npwitk/Macintosh-Skeletal-Filled); giấy phép nằm trong `app/fonts/LICENSE.txt`.

Giấy phép upstream chỉ cho mục đích cá nhân, phi thương mại hoặc giáo dục; không dùng font trong sản phẩm thương mại hay gợi ý có liên kết với Apple.
