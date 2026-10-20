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
5. Thêm biến môi trường `NEXT_PUBLIC_SITE_URL` bằng URL Vercel hoặc tên miền chính thức để OG preview tạo URL đúng.

## Cá nhân hóa trước khi gửi
- Thay ảnh minh họa tại `config/anniversary.ts` bằng ảnh thật của hai bạn (ít nhất 10 ảnh). Ảnh hiện tại là ảnh phong cảnh mẫu, chưa phải ảnh của hai người.
- Nếu có nhạc, đặt file MP3 tại `public/audio/theme.mp3`. Chưa kèm nhạc vì chưa có file được cấp phép; nút nhạc sẽ hiện nhưng cần có file để phát.
- Sửa các mốc timeline, chú thích và thư trong `config/anniversary.ts`.
- Mật khẩu hiện tại là `3010`. Đây là cổng riêng tư phía trình duyệt, không phải xác thực bảo mật: mã được đóng gói trong JavaScript. Với nội dung thực sự riêng tư, nên thêm bảo vệ ở tầng server/Vercel.

## Ghi chú
- Metadata noindex/nofollow và robots disallow đã bật.
- Counter dùng mốc ISO có offset +07:00, độc lập múi giờ máy.
- Tôn trọng prefers-reduced-motion; nhạc chỉ được phép phát sau tương tác người dùng.
- Đã có ảnh OG tự tạo tại `app/opengraph-image.tsx` và icon tại `app/icon.tsx`.
