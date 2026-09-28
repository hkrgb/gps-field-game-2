# GPS 實地考察遊戲平台 2.0

靜態網站＋共用老師工作區：已登入的老師（Google／學校網域 Gmail）共用同一個後端，可一起建立／編輯／監察所有 GPS＋問題專案；每個專案有獨立公開代碼（slug）。隊伍以 GPS 到達指定範圍後解鎖問題並提交答案。

技術棧：**GitHub Pages 就緒靜態站** ＋ **Firebase Auth / Firestore / Storage**；未設定 Firebase 時自動進入 **Demo 模式**（localStorage）。

---

## 目錄結構

```
gps-game-2.0/
  index.html          # Hash SPA 主頁
  css/app.css
  js/firebase-config.js
  js/app.js / auth.js / student.js / teacher.js / gps.js / data.js
  firestore.rules
  storage.rules
  README.md
  reference-v1.html   # v1 單站參考（請勿覆寫）
```

---

## 本地 Demo（無需 Firebase）

```bash
cd /workspace/gps-game-2.0
python3 -m http.server 8080
```

瀏覽器開啟：`http://localhost:8080/` 或 `http://localhost:8080/?demo=1`

### Demo 帳號

| 角色 | 方式 |
|------|------|
| 隊伍 | 專案代碼 `cheungchau-demo`、隊伍 `示範隊`、密碼 `demo`（或第1組／第2組，密碼 `1234`） |
| 老師 | 首頁「管理員」→「老師 Google 登入」（Demo 會以示範老師進入本地後台） |

建議流程：

1. 隊伍登入 → 看進度方格 → 開「測試模式」解鎖地區 → 作答提交 → 進度更新  
2. 管理員 → 新增／編輯／複製／刪除專案 → 改地區與問題、GPS 範圍、字級 → 監察隊伍與 CSV 匯出  

公開連結參數：`?p=cheungchau-demo`（可加 `&demo=1`）。

---

## 接上真實 Firebase

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案。  
2. 啟用 **Authentication → Google**。  
3. 建立 **Firestore**、**Storage**。  
4. 將網頁 App 的設定貼到 `js/firebase-config.js`（替換所有 `YOUR_*`）。  
5. （可選）設定 `ALLOWED_TEACHER_DOMAIN` 為學校網域，例如 `school.edu.hk`。  
6. 部署規則：

```bash
firebase deploy --only firestore:rules,storage
```

7. Authentication → Settings → Authorized domains：加入 `localhost` 與你的 GitHub Pages 網域。  
8. 重新整理網站；若設定已填妥且網址不含強制 `?demo=1`，會走真實 Firebase。

### Firestore 資料模型（摘要）

- `teachers/{uid}`  
- `projects/{projectId}` — `ownerUid`, `slug`, `title`, `subtitle`, `gpsRadiusMeters`, `fontSize`, `showTestMode`, …  
- `projects/{projectId}/locations/{locId}` — `name`, `lat`, `lng`, `description`, `order`, `images[]`, `questions[]`  
  - 問題：`{ id, type: 'mcq'|'text', text, options?, imageUrl?, order }`  
- `projects/{projectId}/teams/{teamId}` — `name`, `password`（MVP 明文；正式應雜湊）  
- `projects/{projectId}/submissions/{id}` — `teamId`, `teamName`, `locationId`, `answers`, `submittedAt`, `coords?`  
- `projects/{projectId}/teamSessions/{teamId}` — `lastLoginAt`, `completedLocationIds[]`  

---

## 部署到 GitHub Pages

1. 將本資料夾推到 GitHub 倉庫（例如 `docs/` 或倉庫根目錄）。  
2. Repo → Settings → Pages → 選分支與資料夾。  
3. 學生連結：`https://<user>.github.io/<repo>/?p=<projectSlug>`  
4. 在 Firebase Authorized domains 加入 Pages 網域。  

純靜態、無需伺服器；GPS 需 HTTPS（Pages 已符合；本機 localhost 亦可）。

---

## 使用說明

### 老師（共用工作區）

1. 管理員分頁 → Google 登入。  
2. 登入後看到**全部專案**（非個人專屬列表）；老師 A、B 操作同一後端。  
3. 新增專案（標題＋公開代碼）；仍會記錄 `ownerUid`／`createdBy` 作稽核，但不影響可見性。  
4. 設定 GPS 範圍、字級、是否顯示測試模式。  
5. 新增地區（座標、簡介、指引圖 URL）與問題（多項選擇／短句子，可附圖）。  
6. 新增隊伍名稱與密碼，派給學生。  
7. 「監察」查看登入時間、完成進度、答案；可匯出 CSV。  
8. 可複製／刪除專案（任何已登入老師皆可）。

### 隊伍／學生

1. 開啟老師提供的連結（含 `?p=`）或手動輸入專案代碼。  
2. 輸入隊伍名稱與密碼。  
3. Header 顯示隊名與進度方格（N 個地區＝N 格）。  
4. 第二頁為任務地區列表（未完成／已完成）。  
5. 內容頁永遠顯示地區資料與圖片；**到達 GPS 範圍才顯示問題與提交**。  
6. 可刷新定位；若老師開啟測試模式，可於校內預演。

---

## 安全注意（重要）

`firestore.rules` / `storage.rules` 為**校內 MVP** 友善設定：

- **共用老師工作區**：任何已通過 Firebase Auth（Google）的帳號皆可讀寫專案／地點／隊伍／提交／監察。風險：帳號外洩即可改刪資料。正式環境請改老師白名單、自訂 claim，或限制 `ALLOWED_TEACHER_DOMAIN`。  
- 隊伍密碼**明文**存於 Firestore，且客戶端可讀（方便驗證）。正式環境請改：Cloud Function 登入、只存雜湊、禁止讀 `password`。  
- 提交與 `teamSessions` 寫入較寬鬆，公開網際網路部署前請收緊並啟用 **App Check**。  
- 建議限制老師電郵網域、定期匯出備份、勿把服務帳戶金鑰放進前端。  
- 部署規則後請在 Firebase Console 重新發佈 Firestore／Storage rules。

---

## 設計取捨

- **Hash SPA 單頁**：適配 GitHub Pages，無需伺服器路由。  
- **Demo 自動偵測**：`YOUR_*` 佔位或 `?demo=1` → localStorage，方便試 UI。  
- **每地區獨立提交**：方便老師即時監察；進度以 `completedLocationIds`＋本地草稿雙軌。  
- **測試模式**：沿用 v1 體驗，由專案設定開關。  
- **圖片以 URL／Storage**：Demo 可用 Data URL；正式可用 Storage 規則上傳。  

---

## 授權與參考

產品 UX 參考同目錄 `reference-v1.html`（單校單專案版）。v2 為多租戶重寫，請勿覆寫該參考檔。


---

## 線上版本（GitHub Pages）

- 網站：https://hkrgb.github.io/gps-field-game-2/
- 長洲專案學生入口：https://hkrgb.github.io/gps-field-game-2/?p=cheungchau-kc
- 本機請用 `http://localhost:8080/`（Firebase 對 `127.0.0.1` 較嚴）

老師用 Google 登入後台；隊伍用專案代碼 `cheungchau-kc`，第1–3組密碼 `1234`，示範隊密碼 `demo`。

上線後請把 `hkrgb.github.io` 加到 Firebase Authentication → 授權網域。
