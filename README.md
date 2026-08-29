# Shop thép móng — Bê tông — Cốt pha

Công cụ nhập kích thước móng đơn (giống form CAD), vẽ **mặt cắt A-A / B-B**, **mặt bằng**, **bảng thống kê cốt thép**, khối lượng **bê tông / ván khuôn**, rồi **xuất PDF A2 nằm**.

Dùng được trên web và nhúng vào **Blogger** bằng iframe.

## GitHub.com hay phải hosting?

**Repo trên github.com không chạy được công cụ.** Đó chỉ là nơi lưu mã nguồn. Trình duyệt (và Blogger) cần một địa chỉ HTTPS phục vụ file HTML/JS — tức là hosting.

Cách làm trên GitHub, không cần Vercel/Netlify:

**Cách nhanh:** dùng bộ file đã build trong `docs/` (hoặc zip `shop-thep-mong-github-pages.zip`). Xem [GITHUB-PAGES.md](GITHUB-PAGES.md).

**Cách từ mã nguồn:**

1. Đưa repo lên GitHub (Create repo / push).
2. **Settings → Pages → Deploy from a branch → main → /docs**  
   (hoặc Source: GitHub Actions).
3. Mở URL dạng `https://<user>.github.io/<ten-repo>/`.

GitHub Pages **chính là hosting miễn phí** của GitHub. Nút **Publish** (Vercel) cũng được, nhanh hơn nếu chưa muốn cấu hình Pages.

Blogger không chạy React trực tiếp trong bài viết (chặn script). Sau khi có URL Pages/Vercel, nhúng iframe như mục dưới.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra (mặc định `http://127.0.0.1:43241`).

```bash
npm run build
npm run preview
```

## Cách dùng

1. Chọn lệch tâm / đúng tâm, nhập `Xmong`, `Ymong`, cổ cột / cột, cao `HCOM` `HCM` `HDM`.
2. Khai báo thép cổ cột (`Cx`, `Cy`, đường kính, đai) và thép đế (`FaX`, `FaY`, khoảng `a`).
3. Bấm **Shop thép - Bê tông - Cốt pha**.
4. Bản vẽ hiện ngay dưới form. Bấm **Tải file PDF** nếu cần file A2 nằm (một trang, đủ khung viền). **Xem CAD** để pan/zoom trên nền tối. **Tải file CAD (DXF)** để mở trong AutoCAD / LibreCAD (đơn vị mm). Trình duyệt không ghi được file DWG gốc — AutoCAD mở DXF trực tiếp. **In** ra khổ A2 nằm một trang.

Nút **Nạp mẫu bản vẽ** điền số liệu gần với file shop mẫu (móng M2, 2000×2200).

Nút **EN** đổi giao diện sang tiếng Anh.

## Công thức khối lượng

Đơn vị mét. Trọng lượng thép: tiết diện thanh × 7850 kg/m³.

- Ván khuôn móng: `(Ymong + Xmong) * 2 * Hdm`
- Ván khuôn cổ cột: `(Ycot + Xcot) * 2 * Hcom`
- Bê tông cổ cột: `Ycot * Xcot * Hcom`
- Bê tông lót: `(Xmong+0.2)*(Ymong+0.2)*` chiều dày lót (nhô 0.1 m mỗi phía)
- Bê tông móng (đế + chóp cụt cánh móng):

```
Ymong*Xmong*Hdm
+ Hcm/3 * (Ymong*Xmong + (Xcot+0.1)*(Ycot+0.1) + sqrt(Ymong*Xmong*(Xcot+0.1)*(Ycot+0.1)))
```

Số thanh lưới đế: `floor((cạnh - 2*cover) / a) + 1`.
Số thanh dọc cổ cột: `2 * (Cx + Cy - 2)` (tối thiểu 2 thanh mỗi phương).
Thép chủ số 3 (L): đoạn thẳng `HCOM+HCM+HDM − 100 mm`, móc vuông góc `300 mm`.
Đai: `floor(Hcom / a) + 1`, chu vi `2*(A+B) + 2*móc`.

## Nhúng vào Blogger

1. Lấy URL GitHub Pages (`https://<user>.github.io/<ten-repo>/`) hoặc Vercel.
2. Trong Blogger: **Bố cục → thêm gadget HTML/JavaScript** (hoặc HTML trong bài viết).
3. Dán:

```html
<iframe
  src="https://DIA-CHI-CUA-BAN/"
  width="100%"
  height="980"
  style="border:0;max-width:1200px"
  loading="lazy"
  allow="download">
</iframe>
```

Trong app có nút **Chèn vào Blogger** để sao chép đúng URL hiện tại.

Blogger chặn script lạ trong bài viết; iframe tới trang đã host là cách ổn định nhất.

## Ghi chú kỹ thuật

- Không thay thế phần mềm kết cấu / kiểm tra TCVN. Đây là shop thép và thống kê khối lượng từ số liệu bạn nhập.
- PDF vẽ lại từ SVG (không phải xuất DWG AutoCAD). File **DXF** là bản CAD vector (layer bê tông / thép / kích thước / chữ) mở được trong AutoCAD.
- `Cx` / `Cy` là số thanh trên một mặt cổ cột (kể cả góc). Mặt cắt A-A vẽ đúng `Cx` thanh dọc theo `Xcot`; B-B vẽ `Cy` thanh theo `Ycot`. Lưới đế: A-A hiện FaX bằng nét, FaY bằng chấm (B-B ngược lại). Mặt bằng bố trí thép cột theo chu vi `2*(Cx+Cy-2)`.
