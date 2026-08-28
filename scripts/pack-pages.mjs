import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')
const docs = join(root, 'docs')

if (!existsSync(dist)) {
  throw new Error('Chưa có thư mục dist. Chạy npm run build trước.')
}

rmSync(docs, { recursive: true, force: true })
mkdirSync(docs, { recursive: true })
cpSync(dist, docs, { recursive: true })
for (const extra of ['404.html']) {
  const src = join(root, 'public', extra)
  if (existsSync(src)) cpSync(src, join(docs, extra))
}
for (const extra of ['shop-thep-mong-github-pages.zip']) {
  const p = join(docs, extra)
  if (existsSync(p)) rmSync(p)
}
writeFileSync(join(docs, '.nojekyll'), '')
writeFileSync(
  join(docs, 'HUONG-DAN-GITHUB-PAGES.txt'),
  `SHOP THÉP MÓNG — GỬI LÊN GITHUB PAGES
=====================================

Bộ file này đã build xong. Không cần npm / Node.

1. Tạo repo trống trên GitHub (không tick Add README).
2. Upload TOÀN BỘ nội dung thư mục này lên gốc repo:
     .nojekyll
     index.html
     favicon.svg
     assets/
3. Vào repo: Settings → Pages
     Source: Deploy from a branch
     Branch: main
     Folder: / (root)
     Save
4. Đợi ~1 phút, mở:
     https://<ten-user>.github.io/<ten-repo>/

Nhúng Blogger: dán iframe trỏ tới URL trên.

Không mở index.html bằng double-click trên máy (file://). Phải qua GitHub Pages.
`,
)

const zipDir = join(root, 'release')
rmSync(zipDir, { recursive: true, force: true })
mkdirSync(zipDir, { recursive: true })
const zipPath = join(zipDir, 'shop-thep-mong-github-pages.zip')
execSync(`cd "${docs}" && zip -r "${zipPath}" . -x "*.DS_Store" "*.zip"`, { stdio: 'inherit' })
cpSync(zipPath, join(root, 'public', 'shop-thep-mong-github-pages.zip'))

const artifacts = '/opt/cursor/artifacts'
if (existsSync(artifacts)) {
  cpSync(zipPath, join(artifacts, 'shop-thep-mong-github-pages.zip'))
}

console.log('GitHub Pages folder: docs/')
console.log('Zip:', zipPath)
