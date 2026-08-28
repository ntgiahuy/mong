# Gửi lên GitHub Pages (bộ file đã build)

Không cần cài Node. Dùng thư mục `docs/` hoặc file zip `shop-thep-mong-github-pages.zip`.

**Cursor không xem được file .zip** (hiện “Preview not available”). Tải zip trong trình duyệt:

- Trang tải: mở Preview rồi vào `/tai-github-pages.html`
- File trực tiếp: `/shop-thep-mong-github-pages.zip`

## Cách 1 — Upload file (nhanh nhất)

1. Tải / giải nén zip, hoặc mở thư mục `docs/` trong repo này.
2. Tạo repository trống trên GitHub (bỏ tick README).
3. Bấm **Add file → Upload files**, kéo hết:
   - `index.html`
   - `favicon.svg`
   - `.nojekyll`
   - thư mục `assets/`
4. **Commit changes**.
5. **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: **/ (root)** nếu bạn upload ra gốc repo  
     hoặc **/docs** nếu bạn đẩy nguyên repo này (thư mục `docs/` đã có sẵn).
6. Save, đợi khoảng 1 phút, mở:

`https://<user>.github.io/<ten-repo>/`

## Cách 2 — Đẩy nguyên repo này

1. Push nhánh `main` lên GitHub.
2. Settings → Pages → Deploy from a branch → `main` → **/docs**.

Hoặc Source: **GitHub Actions** (workflow tự `npm run build`).

## Blogger

Khi đã có URL Pages, dán:

```html
<iframe
  src="https://<user>.github.io/<ten-repo>/"
  width="100%"
  height="980"
  style="border:0;max-width:1200px"
  loading="lazy"
  allow="download">
</iframe>
```

Không dùng `127.0.0.1` hay `file://`.

## Lỗi “The page you’re looking for has wandered off”

Đây là **trang 404 của GitHub**, không phải lỗi công cụ. URL `*.github.io/...` chưa có site.

Làm lần lượt:

1. Repo phải nằm trên **github.com** (Create repository), không chỉ trong Cursor.
2. Trong repo phải thấy `index.html` (và thư mục `assets/` nếu upload zip).  
   Nếu thấy `package.json`, `src/` ở gốc: đừng chọn folder `/ (root)` — chọn **/docs**.
3. **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/docs` (repo đầy đủ) hoặc `/ (root)` (chỉ file đã build)
   - Save
4. Đợi 1–2 phút đến khi có chữ **Your site is live at https://…**
5. Mở **đúng** URL GitHub in ra, nhớ dấu `/` cuối.  
   Ví dụ repo `shop-thep-mong` của user `nguyenvana`:  
   `https://nguyenvana.github.io/shop-thep-mong/`

Sai URL (thiếu tên repo, sai chữ hoa) cũng ra trang “wandered off”.

Nút **Publish** trên Cursor (Vercel) tránh bước này nếu chưa muốn cấu hình Pages.
