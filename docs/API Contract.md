# API Contract — MindDraft Note App

**Base URL:** `https://api.mindraft.com/v1`  
**Auth:** `Authorization: Bearer <access_token>` (JWT)  
**Content-Type:** `application/json`  
**WebSocket:** `wss://api.mindraft.com/ws`

## Quy ước chung

### Response thành công

```json
{ "data": { ... } }
```

### Response lỗi

```json
{
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "Note không tồn tại hoặc bạn không có quyền truy cập."
  }
}
```

### HTTP Status Codes

|Code|Ý nghĩa|
|---|---|
|200|OK|
|201|Created|
|204|No Content|
|400|Bad Request|
|401|Unauthorized|
|403|Forbidden|
|404|Not Found|
|409|Conflict|
|410|Gone (note đã xóa vĩnh viễn)|
|422|Unprocessable Entity|

### JWT Payload

```json
{
  "user_id": "uuid",
  "status_token": "abc123",
  "exp": 1234567890
}
```

> Mỗi request có JWT, middleware query `SELECT status_token FROM users WHERE id = user_id` và so sánh với giá trị trong payload. Nếu khác → 401. Dùng để vô hiệu hóa tất cả AT cũ khi đổi mật khẩu.

---

## 1. AUTH

### 1.1 Đăng ký

```
POST /auth/register
```

**Body:**

```json
{
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response 200:**

```json
{
  "data": {
    "message": "OTP đã được gửi tới email. Vui lòng xác thực trong 5 phút."
  }
}
```

**Errors:** `EMAIL_ALREADY_EXISTS` (409), `NAME_ALREADY_EXISTS` (409), `INVALID_FORMAT` (422)

---

### 1.2 Xác thực OTP

```
POST /auth/verify-otp
```

> Dùng chung cho cả 2 luồng, phân biệt qua `purpose`.

**Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "register"
}
```

> `purpose`: `"register"` hoặc `"reset_password"`.

**Response khi `purpose = "register"` → 201:**

```json
{
  "data": {
    "access_token": "<jwt>",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "name": "Nguyen Van A",
      "email": "user@example.com",
      "avatar_url": null
    }
  }
}
```

> `refresh_token` được set trong **HttpOnly Cookie**.

**Response khi `purpose = "reset_password"` → 200:**

```json
{
  "data": {
    "reset_token": "<uuid>",
    "expires_in": 900
  }
}
```

> `reset_token` single-use, hết hạn sau 15 phút.

**Errors:** `OTP_INVALID` (400), `OTP_EXPIRED` (400)

---

### 1.3 Gửi lại OTP

```
POST /auth/resend-otp
```

**Body:**

```json
{
  "email": "user@example.com",
  "purpose": "register"
}
```

**Response 200:**

```json
{ "data": { "message": "OTP mới đã được gửi." } }
```

**Errors:** `EMAIL_NOT_FOUND` (404)

---

### 1.4 Đăng nhập

```
POST /auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response 200:**

```json
{
  "data": {
    "access_token": "<jwt>",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "name": "Nguyen Van A",
      "email": "user@example.com",
      "avatar_url": null
    }
  }
}
```

> `refresh_token` được set trong **HttpOnly Cookie**.

**Errors:** `INVALID_CREDENTIALS` (401), `ACCOUNT_NOT_VERIFIED` (403)

---

### 1.5 Đăng nhập / Đăng ký bằng Google OAuth

```
POST /auth/google
```

**Body:**

```json
{ "id_token": "<google_id_token>" }
```

**Response 200 / 201:** (giống 1.4)

---

### 1.6 Làm mới Access Token

```
POST /auth/refresh
```

> Không cần body. `refresh_token` đọc từ HttpOnly Cookie.

**Response 200:**

```json
{
  "data": {
    "access_token": "<new_jwt>",
    "expires_in": 900
  }
}
```

**Errors:** `REFRESH_TOKEN_INVALID` (401), `REFRESH_TOKEN_EXPIRED` (401)

---

### 1.7 Đăng xuất

```
POST /auth/logout
```

> Server revoke `refresh_token` từ cookie (set `revoked_at = NOW()`).

**Response 204**

---

### 1.8 Quên mật khẩu — Gửi OTP

```
POST /auth/forgot-password
```

**Body:**

```json
{ "email": "user@example.com" }
```

**Response 200:**

```json
{ "data": { "message": "OTP đã được gửi tới email." } }
```

**Errors:** `EMAIL_NOT_FOUND` (404)

---

### 1.9 Đặt lại mật khẩu mới

```
POST /auth/reset-password
```

**Body:**

```json
{
  "reset_token": "<uuid>",
  "new_password": "NewPass456!",
  "logout_all_devices": true
}
```

> Nếu `logout_all_devices: true` → revoke toàn bộ `refresh_tokens` của user + đổi `status_token` trong bảng `users` (vô hiệu hóa tất cả AT cũ trên mọi thiết bị).

**Response 200:**

```json
{
  "data": {
    "access_token": "<jwt>",
    "expires_in": 900
  }
}
```

> `refresh_token` mới được set trong **HttpOnly Cookie**.

**Errors:** `RESET_TOKEN_INVALID` (400), `RESET_TOKEN_EXPIRED` (400), `SAME_PASSWORD` (422)

---

## 2. USERS

### 2.1 Lấy thông tin bản thân

```
GET /users/me
```

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "avatar_url": "https://cdn.mindraft.com/...",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 2.2 Cập nhật thông tin cá nhân

```
PATCH /users/me
```

**Body** (tất cả optional):

```json
{
  "name": "Nguyen Van B",
  "avatar_url": "https://..."
}
```

**Response 200:** trả về object user đã cập nhật.  
**Errors:** `NAME_ALREADY_EXISTS` (409)

---

### 2.3 Đổi mật khẩu

```
PATCH /users/me/password
```

**Body:**

```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!",
  "logout_all_devices": false
}
```

> Nếu `logout_all_devices: true` → đổi `status_token` + revoke tất cả RT (trừ phiên hiện tại).

**Response 204**  
**Errors:** `WRONG_PASSWORD` (400), `SAME_PASSWORD` (422)

---

### 2.4 Lấy cài đặt

```
GET /users/me/settings
```

**Response 200:**

```json
{
  "data": {
    "theme": "system",
    "notifications_enabled": true,
    "notify_reminder": true,
    "notify_collaboration": true,
    "default_note_view": "GRID",
    "sort_by": "updated_at"
  }
}
```

---

### 2.5 Cập nhật cài đặt

```
PATCH /users/me/settings
```

**Body** (tất cả optional):

```json
{
  "theme": "dark",
  "default_note_view": "LIST",
  "sort_by": "custom"
}
```

> Giá trị hợp lệ `theme`: `"light"`, `"dark"`, `"system"`.  
> Giá trị hợp lệ `default_note_view`: `"GRID"`, `"LIST"`.  
> Giá trị hợp lệ `sort_by`: `"updated_at"`, `"created_at"`, `"custom"` (LexoRank).

**Response 200:** trả về settings đã cập nhật.

---

## 3. NOTES

### Model Note

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Tiêu đề",
  "content": [ ...blocks ],
  "content_text": "plain text...",
  "type": "text",
  "color": "default",
  "is_pinned": false,
  "is_archived": false,
  "is_trashed": false,
  "is_owner": true,
  "position": "a0",
  "created_at": "2025-01-01T00:00:00Z",
  "server_updated_at": "2025-01-01T00:00:00Z",
  "client_updated_at": "2025-01-01T00:00:00Z",
  "trashed_at": null,
  "tags": [ { "id": "uuid", "name": "work" } ],
  "collaborators": [
    {
      "user_id": "uuid",
      "name": "...",
      "avatar_url": "...",
      "accepted_at": "2025-01-01T00:00:00Z"
    }
  ],
  "reminder": { "id": "uuid", "remind_at": "...", "repeat_type": "none" },
  "media": [
    { "id": "uuid", "file_url": "...", "file_type": "image/png", "file_size": 204800 }
  ]
}
```

> Khi CTV gọi `GET /notes`: `is_pinned`, `is_archived`, `is_trashed` trả về giá trị riêng từ bảng `note_collaborators`. `is_owner: false`.

### Giá trị hợp lệ của `color`

`default`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `brown`

### Cấu trúc `content` — type `text`

```json
[
  {
    "id": "uuid-b1",
    "type": "heading",
    "data": { "level": 1, "text": "Tiêu đề" }
  },
  {
    "id": "uuid-b2",
    "type": "text",
    "data": { "text": "Đoạn văn, hỗ trợ <b>in đậm</b>." }
  },
  {
    "id": "uuid-b3",
    "type": "list",
    "data": {
      "style": "unordered",
      "items": ["Mục 1", "Mục 2"]
    }
  },
  {
    "id": "uuid-b4",
    "type": "image",
    "data": {
      "file_id": "uuid-media-001",
      "url": "https://cdn.mindraft.com/...",
      "caption": "Mô tả ảnh"
    }
  },
  {
    "id": "uuid-b5",
    "type": "file",
    "data": {
      "file_id": "uuid-media-002",
      "url": "https://cdn.mindraft.com/...",
      "name": "Báo cáo.pdf",
      "size": "2.5MB",
      "extension": "pdf"
    }
  }
]
```

### Cấu trúc `content` — type `todo`

```json
[
  {
    "id": "uuid-t1",
    "parent_id": null,
    "title": "Task chính",
    "content": "Mô tả thêm",
    "is_completed": false,
    "position": "a0",
    "created_at": "2026-04-26T10:00:00Z",
    "updated_at": "2026-04-26T15:00:00Z",
    "remind_at": "2026-04-27T08:00:00Z",
    "repeat_type": "none",
    "is_notified": false
  },
  {
    "id": "uuid-t2",
    "parent_id": "uuid-t1",
    "title": "Sub-task",
    "content": null,
    "is_completed": true,
    "position": "a1",
    "created_at": "2026-04-26T11:00:00Z",
    "updated_at": "2026-04-26T15:30:00Z",
    "remind_at": null,
    "repeat_type": "none",
    "is_notified": false
  }
]
```

---

### 3.1 Lấy danh sách note

```
GET /notes
```

**Query params:**

|Param|Mô tả|Giá trị hợp lệ|Default|
|---|---|---|---|
|`view`|Bộ lọc trạng thái|`active` \| `archived` \| `trashed`|`active`|
|`tag_id`|Lọc theo tag|uuid|—|
|`page`|Số trang (Infinite Scroll)|integer|1|
|`limit`|Số item / trang|integer|50|

> `active`: note không archived, không trashed — gồm cả note được chia sẻ (CTV đã accepted).  
> Pinned notes **luôn đứng đầu** bất kể `sort_by`. Sau đó sort theo `user_settings.sort_by`.  
> `sort_by = custom`: sort theo `position` (LexoRank). Server thực hiện sort.

**Response 200:**

```json
{
  "data": {
    "notes": [ { ...NoteModel } ],
    "total": 120,
    "page": 1,
    "limit": 50
  }
}
```

---

### 3.2 Đồng bộ note sau khi offline

```
GET /notes/sync?since=<ISO8601>
```

> Trả về tất cả note có `server_updated_at > since` mà user là owner hoặc CTV đã accepted.

**Response 200:**

```json
{
  "data": {
    "upsert": [ { ...NoteModel } ],
    "deleted_ids": ["uuid1", "uuid2"]
  }
}
```

> `deleted_ids`: ID các note có `is_deleted = TRUE` và `deleted_at > since`. Bao gồm cả note bị cron job auto-delete sau 7 ngày trong trash.

---

### 3.3 Lấy chi tiết note

```
GET /notes/:id
```

**Response 200:** `{ "data": { ...NoteModel } }`  
**Errors:** `NOTE_NOT_FOUND` (404), `FORBIDDEN` (403)

---

### 3.4 Tạo note

```
POST /notes
```

**Body:**

```json
{
  "title": "Tiêu đề",
  "content": [ ...blocks ],
  "content_text": "",
  "type": "text",
  "color": "default",
  "position": "a0",
  "client_updated_at": "2025-01-01T00:00:00Z"
}
```

> `type` không thể thay đổi sau khi tạo.

**Response 201:** `{ "data": { ...NoteModel } }`

**WS Event:**

```json
{ "event": "NOTE_CREATED", "payload": { ...NoteModel } }
```

---

### 3.5 Cập nhật nội dung / tiêu đề note

```
PATCH /notes/:id
```

> Chỉ owner và CTV đã accepted mới có quyền.  
> Chỉ `title` và `content` / `content_text` được đồng bộ giữa owner và CTV.

**Body** (tất cả optional):

```json
{
  "title": "Tiêu đề mới",
  "content": [ ...blocks ],
  "content_text": "plain text...",
  "color": "red",
  "position": "b0",
  "client_updated_at": "2025-01-02T00:00:00Z"
}
```

> Server từ chối nếu `client_updated_at` trong request < `client_updated_at` trong DB → 409 CONFLICT.

**Response 200:** `{ "data": { ...NoteModel } }`  
**Errors:** `NOTE_NOT_FOUND` (404), `NOTE_DELETED` (410), `CONFLICT` (409), `FORBIDDEN` (403)

**WS Event** (phát tới tất cả CTV đã accepted):

```json
{ "event": "NOTE_UPDATED", "payload": { ...NoteModel } }
```

---

### 3.6 Ghim / Bỏ ghim note

```
PATCH /notes/:id/pin
```

**Body:** `{ "is_pinned": true }`

> Owner: cập nhật `notes.is_pinned`.  
> CTV: cập nhật `note_collaborators.is_pinned` — chỉ ảnh hưởng phía CTV, không phát WS.

**Response 200:** `{ "data": { "id": "uuid", "is_pinned": true } }`

---

### 3.7 Lưu trữ / Bỏ lưu trữ note

```
PATCH /notes/:id/archive
```

**Body:** `{ "is_archived": true }`

> Owner: cập nhật `notes.is_archived`.  
> CTV: cập nhật `note_collaborators.is_archived` — chỉ ảnh hưởng phía CTV, không phát WS.

**Response 200:** `{ "data": { "id": "uuid", "is_archived": true } }`

---

### 3.8 Chuyển note vào thùng rác

```
PATCH /notes/:id/trash
```

> Chỉ owner được phép. Khi owner trash → note biến mất với tất cả CTV.

**Response 200:** `{ "data": { "id": "uuid", "is_trashed": true, "trashed_at": "..." } }`

**WS Event** (phát tới tất cả CTV):

```json
{ "event": "NOTE_TRASHED", "payload": { "id": "uuid" } }
```

---

### 3.9 Khôi phục note từ thùng rác

```
PATCH /notes/:id/restore
```

> Chỉ owner được phép.

**Response 200:** `{ "data": { ...NoteModel } }`

**WS Event:** `NOTE_UPDATED`

---

### 3.10 Xóa vĩnh viễn note

```
DELETE /notes/:id
```

> Chỉ owner được phép. Note phải đang ở `is_trashed = TRUE`.  
> Server set `is_deleted = TRUE`, `deleted_at = NOW()` — không hard-delete ngay.  
> Cron job hard-delete sau 30 ngày.

**Response 204**  
**Errors:** `NOTE_NOT_IN_TRASH` (400), `FORBIDDEN` (403)

**WS Event** (phát tới tất cả CTV):

```json
{ "event": "NOTE_PERMANENTLY_DELETED", "payload": { "id": "uuid" } }
```

> Client nhận event này phải xóa note khỏi local state ngay. Nếu đang mở note đó → đóng editor + toast "Note này đã bị xóa".

---

### 3.11 Xóa toàn bộ thùng rác

```
DELETE /notes/trash/empty
```

> Set `is_deleted = TRUE`, `deleted_at = NOW()` cho tất cả note `is_trashed = TRUE` của user.

**Response 200:** `{ "data": { "deleted_count": 5 } }`

**WS Event:**

```json
{
  "event": "TRASH_EMPTIED",
  "payload": { "deleted_ids": ["uuid1", "uuid2"] }
}
```

---

## 4. TAGS

### 4.1 Lấy danh sách tag

```
GET /tags
```

**Response 200:**

```json
{
  "data": [
    { "id": "uuid", "name": "work", "created_at": "2025-01-01T00:00:00Z" }
  ]
}
```

---

### 4.2 Tạo tag

```
POST /tags
```

**Body:** `{ "name": "personal" }`  
**Response 201:** `{ "data": { "id": "uuid", "name": "personal" } }`  
**Errors:** `TAG_ALREADY_EXISTS` (409)

---

### 4.3 Đổi tên tag

```
PATCH /tags/:id
```

**Body:** `{ "name": "personal-new" }`  
**Response 200:** `{ "data": { "id": "uuid", "name": "personal-new" } }`  
**Errors:** `TAG_ALREADY_EXISTS` (409)

---

### 4.4 Xóa tag

```
DELETE /tags/:id
```

> Soft delete: set `tags.is_deleted = TRUE`, đồng thời set `note_tags.is_deleted = TRUE` cho tất cả liên kết.

**Response 204**

**WS Event:** `{ "event": "TAG_DELETED", "payload": { "tag_id": "uuid" } }`

---

## 5. NOTE TAGS

### 5.1 Gắn tag vào note

```
POST /notes/:id/tags
```

**Body:** `{ "tag_id": "uuid" }`

> Owner và CTV đều có thể gắn tag, nhưng tag chỉ áp dụng riêng cho người gắn — không đồng bộ.

**Response 201:** `{ "data": { "note_id": "uuid", "tag_id": "uuid" } }`  
**Errors:** `TAG_NOT_FOUND` (404)

---

### 5.2 Gỡ tag khỏi note

```
DELETE /notes/:id/tags/:tag_id
```

**Response 204**

---

## 6. COLLABORATORS

### 6.1 Lấy danh sách cộng tác viên của note

```
GET /notes/:id/collaborators
```

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "...",
      "email": "...",
      "avatar_url": "...",
      "invited_by": "uuid",
      "accepted_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 6.2 Mời cộng tác viên

```
POST /notes/:id/collaborators
```

> Owner và CTV đã accepted đều có thể mời.

**Body:** `{ "email": "collaborator@example.com" }`

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "invited_by": "uuid",
    "accepted_at": null
  }
}
```

**Errors:** `USER_NOT_FOUND` (404), `ALREADY_COLLABORATOR` (409)

**WS Event** (gửi đến user được mời):

```json
{
  "event": "COLLABORATION_INVITED",
  "payload": {
    "note_id": "uuid",
    "note_title": "...",
    "invited_by": { "id": "uuid", "name": "...", "avatar_url": "..." }
  }
}
```

---

### 6.3 Chấp nhận lời mời cộng tác

```
POST /notes/:id/collaborators/accept
```

> Set `accepted_at = NOW()` trong `note_collaborators`.

**Response 200:** `{ "data": { "accepted_at": "2025-01-01T00:00:00Z" } }`  
**Errors:** `INVITATION_NOT_FOUND` (404), `ALREADY_ACCEPTED` (409)

---

### 6.4 Xóa cộng tác viên / Tự rời khỏi cộng tác

```
DELETE /notes/:id/collaborators/:user_id
```

> Owner: xóa được bất kỳ CTV nào.  
> CTV: chỉ xóa được chính mình hoặc CTV do mình mời (`invited_by = me`).

**Response 204**  
**Errors:** `FORBIDDEN` (403)

**WS Event:**

```json
{
  "event": "COLLABORATOR_REMOVED",
  "payload": { "note_id": "uuid", "user_id": "uuid" }
}
```

---

### 6.5 Cập nhật trạng thái riêng của CTV (ghim / lưu trữ / ẩn)

```
PATCH /notes/:id/collaborators/me/state
```

> Cập nhật `note_collaborators` của user hiện tại. Không ảnh hưởng note gốc hay CTV khác.

**Body** (tất cả optional):

```json
{
  "is_pinned": true,
  "is_archived": false,
  "is_trashed": false
}
```

**Response 200:** `{ "data": { "is_pinned": true, "is_archived": false, "is_trashed": false } }`

---

## 7. MEDIA

### 7.1 Xin Presigned URL để upload file lên S3

```
POST /media/presigned-url
```

**Body:**

```json
{
  "file_name": "image.png",
  "file_type": "image/png",
  "file_size": 204800,
  "note_id": "uuid"
}
```

> Giới hạn dung lượng: image ≤ 5MB, video ≤ 30MB, PDF ≤ 10MB.  
> Loại file chấp nhận: `image/*`, `video/*`, `application/pdf`.  
> Server lưu metadata vào bảng `media` ngay tại bước này — không cần gọi API xác nhận sau.

**Response 201:**

```json
{
  "data": {
    "media_id": "uuid",
    "upload_url": "https://s3.amazonaws.com/...?X-Amz-Signature=...",
    "file_url": "https://cdn.mindraft.com/users/uuid/notes/uuid/media_id.png",
    "expires_in": 300
  }
}
```

> Client sau khi nhận response: thực hiện `PUT <upload_url>` với body binary file và header `Content-Type: image/png` trực tiếp lên S3. Không cần gọi thêm API.

**Errors:** `UNSUPPORTED_FILE_TYPE` (422), `FILE_TOO_LARGE` (422), `NOTE_NOT_FOUND` (404)

---

### 7.2 Xóa file đính kèm

```
DELETE /notes/:id/media/:media_id
```

> Soft delete: set `media.is_deleted = TRUE`.  
> Chỉ người đã upload (`uploaded_by`) hoặc owner của note mới có quyền.

**Response 204**  
**Errors:** `FORBIDDEN` (403), `MEDIA_NOT_FOUND` (404)

---

## 8. REMINDERS

> Chỉ áp dụng cho note `type = "text"`. Mỗi user tối đa 1 reminder / note. Reminder không đồng bộ giữa owner và CTV.

### 8.1 Tạo hoặc cập nhật lời nhắc cho note

```
PUT /notes/:id/reminder
```

> Idempotent upsert — đã tồn tại thì cập nhật, chưa tồn tại thì tạo mới.

**Body:**

```json
{
  "remind_at": "2025-06-01T08:00:00Z",
  "repeat_type": "none"
}
```

> Giá trị hợp lệ `repeat_type`: `"none"`, `"daily"`, `"weekly"`, `"monthly"`.

**Response 200 / 201:**

```json
{
  "data": {
    "id": "uuid",
    "remind_at": "2025-06-01T08:00:00Z",
    "repeat_type": "none",
    "is_notified": false
  }
}
```

**Errors:** `NOTE_TYPE_INVALID` (422)

---

### 8.2 Xóa lời nhắc

```
DELETE /notes/:id/reminder
```

**Response 204**

---

## 9. TODO ITEMS

> Chỉ áp dụng cho note `type = "todo"`. Gửi toàn bộ mảng — server tự diff và cập nhật DB trong 1 transaction.

### 9.1 Cập nhật toàn bộ todo items của note

```
PUT /notes/:id/todos
```

> Server DELETE tất cả `todo_items` hiện tại rồi INSERT lại từ mảng gửi lên trong 1 transaction.  
> Giữ nguyên `id` và `parent_id` để bảo toàn quan hệ cha-con.  
> Sub-task tối đa 1 cấp: `parent_id` của 1 item không được trỏ tới item khác đã có `parent_id != null` → 422.

**Body:**

```json
{
  "todos": [
    {
      "id": "uuid-t1",
      "parent_id": null,
      "title": "Task chính",
      "content": null,
      "is_completed": false,
      "position": "a0",
      "remind_at": null,
      "repeat_type": "none"
    },
    {
      "id": "uuid-t2",
      "parent_id": "uuid-t1",
      "title": "Sub-task",
      "content": null,
      "is_completed": true,
      "position": "a1",
      "remind_at": null,
      "repeat_type": "none"
    }
  ]
}
```

**Response 200:**

```json
{
  "data": {
    "todos": [ ...toàn bộ mảng sau khi lưu ]
  }
}
```

**Errors:** `MAX_DEPTH_EXCEEDED` (422), `NOTE_TYPE_INVALID` (422)

**WS Event** (phát tới CTV để sync lại): `NOTE_UPDATED`

---

## 10. NOTE VERSIONS

### 10.1 Lấy danh sách lịch sử phiên bản

```
GET /notes/:id/versions
```

> Tối đa 20 bản gần nhất, `saved_at DESC`.

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "saved_at": "2025-01-01T00:00:00Z",
      "editors": [
        { "user_id": "uuid", "name": "...", "avatar_url": "..." }
      ]
    }
  ]
}
```

---

### 10.2 Lấy chi tiết một phiên bản

```
GET /notes/:id/versions/:version_id
```

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "title": "Tiêu đề lúc đó",
    "content": [ ...blocks ],
    "saved_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 10.3 Tạo phiên bản mới (client trigger)

```
POST /notes/:id/versions
```

> Client gọi khi: user dừng gõ >= 1 phút VÀ nội dung thay đổi >= 20 ký tự.  
> Server snapshot từ DB — không dùng data client gửi lên. Timestamp dùng đồng hồ server.  
> Nếu đã có 20 version → xóa version cũ nhất trước khi tạo mới.

**Body:** Không cần body.

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "saved_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 10.4 Khôi phục về phiên bản cũ

```
POST /notes/:id/versions/:version_id/restore
```

> Server: (1) snapshot note hiện tại thành version mới, (2) ghi đè `notes.content` và `notes.title`.  
> Với `type = "todo"`: DELETE todo_items hiện tại → INSERT lại từ JSON snapshot, giữ nguyên `id` và `parent_id`. Toàn bộ trong 1 transaction.

**Response 200:** `{ "data": { ...NoteModel } }`

**WS Event:** `NOTE_UPDATED`

---

## 11. NOTIFICATIONS

### Model Notification

```json
{
  "id": "uuid",
  "type": "reminder_triggered",
  "note_id": "uuid",
  "payload": { ... },
  "is_read": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

> Giá trị hợp lệ `type`: `"reminder_triggered"`, `"collaboration_invited"`, `"collaborator_removed"`.

---

### 11.1 Lấy danh sách thông báo

```
GET /notifications
```

**Query params:** `page` (default 1), `limit` (default 20)

**Response 200:**

```json
{
  "data": {
    "notifications": [ { ...NotificationModel } ],
    "unread_count": 5,
    "total": 30,
    "page": 1,
    "limit": 20
  }
}
```

---

### 11.2 Đánh dấu một thông báo đã đọc

```
PATCH /notifications/:id/read
```

**Response 200:** `{ "data": { "id": "uuid", "is_read": true } }`

---

### 11.3 Đánh dấu tất cả thông báo đã đọc

```
PATCH /notifications/read-all
```

**Response 200:** `{ "data": { "updated_count": 5 } }`

---

## 12. WEBSOCKET

### Kết nối

```
wss://api.mindraft.com/ws?token=<access_token>
```

> Server xác thực JWT khi handshake. Token hết hạn hoặc `status_token` không khớp → đóng kết nối code `4001`.

### Ping / Pong (keep-alive)

Client gửi mỗi 30s: `{ "type": "ping" }`  
Server phản hồi: `{ "type": "pong" }`

### Format sự kiện

```json
{
  "event": "NOTE_UPDATED",
  "payload": { ... },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Bảng sự kiện Server → Client

|Event|Trigger|Payload|
|---|---|---|
|`NOTE_CREATED`|Note mới tạo|`NoteModel`|
|`NOTE_UPDATED`|Sửa nội dung, pin, archive, restore, todo sync|`NoteModel`|
|`NOTE_TRASHED`|Owner chuyển vào trash|`{ id }`|
|`NOTE_PERMANENTLY_DELETED`|Owner xóa vĩnh viễn|`{ id }`|
|`TRASH_EMPTIED`|Owner xóa toàn bộ trash|`{ deleted_ids: [...] }`|
|`COLLABORATION_INVITED`|User được mời CTV|`{ note_id, note_title, invited_by }`|
|`COLLABORATOR_REMOVED`|CTV bị xóa hoặc tự rời|`{ note_id, user_id }`|
|`NOTE_REMINDER_TRIGGERED`|Đến giờ nhắc|`{ note_id, reminder_id, title }`|
|`TAG_DELETED`|Tag bị xóa|`{ tag_id }`|

### Logic client khi reconnect WebSocket

```
1. Kết nối lại thành công
2. Gọi GET /notes/sync?since=<last_synced_at>
3. Upsert các note trong "upsert[]" vào local state
4. Xóa local các note trong "deleted_ids[]"
5. Gọi GET /notifications để cập nhật thông báo trong thời gian offline
6. Cập nhật last_synced_at = now()
```

---

## 13. ERROR CODES

|Code|HTTP|Mô tả|
|---|---|---|
|`INVALID_FORMAT`|422|Dữ liệu sai định dạng|
|`EMAIL_ALREADY_EXISTS`|409|Email đã đăng ký|
|`NAME_ALREADY_EXISTS`|409|Tên đã tồn tại|
|`EMAIL_NOT_FOUND`|404|Email không tồn tại trong hệ thống|
|`INVALID_CREDENTIALS`|401|Sai email hoặc password|
|`ACCOUNT_NOT_VERIFIED`|403|Chưa xác thực OTP|
|`OTP_INVALID`|400|Mã OTP sai|
|`OTP_EXPIRED`|400|Mã OTP hết hạn|
|`RESET_TOKEN_INVALID`|400|Reset token sai hoặc đã dùng|
|`RESET_TOKEN_EXPIRED`|400|Reset token hết hạn|
|`TOKEN_EXPIRED`|401|Access token hết hạn|
|`REFRESH_TOKEN_INVALID`|401|Refresh token không hợp lệ|
|`REFRESH_TOKEN_EXPIRED`|401|Refresh token hết hạn|
|`WRONG_PASSWORD`|400|Mật khẩu hiện tại sai|
|`SAME_PASSWORD`|422|Mật khẩu mới trùng mật khẩu cũ|
|`NOTE_NOT_FOUND`|404|Note không tồn tại|
|`NOTE_DELETED`|410|Note đã bị xóa vĩnh viễn|
|`NOTE_NOT_IN_TRASH`|400|Note chưa ở trong thùng rác|
|`NOTE_TYPE_INVALID`|422|Hành động không hợp lệ với loại note này|
|`FORBIDDEN`|403|Không có quyền thao tác|
|`CONFLICT`|409|`client_updated_at` cũ hơn server|
|`TAG_ALREADY_EXISTS`|409|Tag đã tồn tại|
|`TAG_NOT_FOUND`|404|Tag không tồn tại|
|`ALREADY_COLLABORATOR`|409|User đã là cộng tác viên|
|`INVITATION_NOT_FOUND`|404|Lời mời không tồn tại|
|`ALREADY_ACCEPTED`|409|Đã chấp nhận lời mời trước đó|
|`MAX_DEPTH_EXCEEDED`|422|Sub-task chỉ tối đa 1 cấp|
|`UNSUPPORTED_FILE_TYPE`|422|Loại file không được hỗ trợ|
|`FILE_TOO_LARGE`|422|File vượt giới hạn dung lượng|
|`MEDIA_NOT_FOUND`|404|File không tồn tại|
|`USER_NOT_FOUND`|404|User không tồn tại trong hệ thống|
