# Noir Rose — 4 năm bên nhau

Landing page kỷ niệm 4 năm của Trường và bé Bo (Hà Bảo Trân), Next.js App Router + TypeScript + Tailwind CSS v4 + Motion.

## Chạy local
```powershell
npm install
npm run dev
```
Mở http://localhost:3000.

## Deploy Vercel
1. Đẩy thư mục này lên một repository GitHub riêng.
2. Vào https://vercel.com/new, import repository.
3. Framework preset: Next.js; Build Command `npm run build`; Output Directory để mặc định.
4. Deploy, sau đó có thể gắn tên miền ở Project → Settings → Domains.
5. Thêm biến môi trường:
   - `NEXT_PUBLIC_SITE_URL` = URL Vercel hoặc tên miền chính thức (ví dụ `https://3010.vercel.app`) — để OG preview tạo URL đúng.
   - `SITE_PASSWORD` = mật khẩu mở khóa (mặc định `3010`). Đổi thành giá trị riêng nếu muốn.
   - `SESSION_SECRET` = chuỗi bí mật ký cookie (tự sinh một chuỗi ngẫu nhiên dài).
5. Deploy, sau đó có thể gắn tên miền ở Project → Settings → Domains.

## Cấu trúc ảnh thật (Quan trọng!)
Ảnh thật của hai đứa đặt trong thư mục **`photos/`** (ngoài `/public` để không bị public trực tiếp):

```
photos/
├── 01.jpg … 12.jpg     # Gallery album (tương ứng gallery[0]…gallery[11])
├── 01.jpg … 07.jpg     # Timeline dùng lại ảnh gallery 01…07 (theo id trong timeline.photo)
└── companion.png       # Ảnh cắt toàn thân (PNG nền trong suốt) đặt góc màn hình
```

**Cách hoạt động:**
- Route `/api/photo/<id>` kiểm tra cookie phiên → chỉ trả ảnh thật khi đã mở khóa.
- Nếu file thật thiếu → tự rơi về ảnh mẫu Unsplash (`fallback` trong config).
- Ảnh được phục vụ qua `/api/photo/<id>` nên **không public trực tiếp**.
- Companion (ảnh cắt đặt góc): đặt `photos/companion.png` (PNG nền trong suốt). Nếu thiếu → tự ẩn.

**Lưu ý bảo mật:**
- Thư mục `photos/` **KHÔNG** nằm trong `/public` → ảnh thật không public trực tiếp.
- Vercel: cấu hình `experimental.outputFileTracingIncludes` trong `next.config.ts` đã bao gồm `./photos/**` để file ảnh được đóng gói vào serverless function `/api/photo`.
- Nếu deploy bằng `vercel` CLI: đảm bảo file ảnh nằm trong repo.

## Cá nhân hóa trước khi gửi
- Sửa các mốc timeline, chú thích, thư, lời hứa, ngôi sao, companion lines trong `lib/anniversary-data.ts`.
- Mật khẩu mặc định `3010` (đặt trong `SITE_PASSWORD` env). Gợi ý trên màn hình khóa: "gợi ý: 30/10".
- Nhạc nền: Web Audio API (âm thanh tổng hợp). Nếu muốn bài hát thật, thay `MusicToggle` để dùng `<audio>` với file MP3.
- `SESSION_SECRET`: tự sinh chuỗi ngẫu nhiên dài để ký cookie.

## Tương tác mới (v2)
1. **Giữ để mở (Hold-to-open):** Màn hình khóa & phong bì thư — giữ nút ~1.4s có vòng tròn tiến trình.
2. **Phóng to ảnh (Zoom + Swipe):** Chạm ảnh → lightbox; chạm đúp / pinch zoom; vuốt ngang đổi ảnh; ESC/backdrop đóng.
3. **Người bạn đồng hành (Companion):** Ảnh cắt `photos/companion.png` xuất hiện góc dưới trái sau khi mở thư. Bấm vào để nghe lời nhắn ngẫu nhiên.
4. **Phản hồi:** Cuối trang có ô "Viết lại cho anh" — sao chép vào clipboard để dán Zalo/Messenger.
5. **Khoá lại:** Nút "Xem lại từ đầu" giữ nguyên phiên; muốn khoá lại → xóa cookie hoặc POST `/api/lock`.

## Ghi chú kỹ thuật
- Metadata noindex/nofollow, robots disallow, `X-Content-Type-Options: nosniff`.
- Counter dùng mốc ISO +07:00, độc lập múi giờ máy.
- Tôn trọng `prefers-reduced-motion`; nhạc chỉ phát sau tương tác người dùng.
- Ảnh OG tự tạo (`app/opengraph-image.tsx`), icon (`app/icon.tsx`), apple-icon (`app/apple-icon.tsx`), manifest (`app/manifest.ts`) — hỗ trợ "Add to Home Screen" trên iOS.
- `prefers-reduced-motion` được tôn trọng hoàn toàn.
- Code dùng TypeScript strict, ESLint, Tailwind v4, Motion (framer-motion v12).