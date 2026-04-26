-- ============================================================
-- NOTE APP — MySQL Schema
-- Charset: utf8mb4 / utf8mb4_unicode_ci (hỗ trợ tiếng Việt)
-- Yêu cầu MySQL >= 8.0.16 (CHECK constraint)
-- ============================================================

CREATE DATABASE IF NOT EXISTS note_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE note_app;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id              CHAR(36)        NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(512)    NULL,
    status_token    VARCHAR(50)     NULL,
    google_id       VARCHAR(255)    NULL,
    avatar_url      TEXT            NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_name      (name),
    UNIQUE KEY uq_users_email     (email),
    UNIQUE KEY uq_users_google_id (google_id),

    -- Phải có ít nhất 1 trong 2: password hoặc google_id
    CONSTRAINT chk_auth_method CHECK (
        password_hash IS NOT NULL OR google_id IS NOT NULL
    )
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 2. USER_SETTINGS  (1-1 với USERS)
-- ============================================================
CREATE TABLE user_settings (
    user_id                 CHAR(36)                        NOT NULL,
    theme                   ENUM('light','dark','system')   NOT NULL DEFAULT 'system',
    notifications_enabled   BOOLEAN                         NOT NULL DEFAULT TRUE,
    notify_reminder         BOOLEAN                         NOT NULL DEFAULT TRUE,
    notify_collaboration    BOOLEAN                         NOT NULL DEFAULT TRUE,
    default_note_view       ENUM('GRID','LIST')             NOT NULL DEFAULT 'GRID',
    -- 'updated_at' | 'created_at' | 'custom'
    sort_by                 VARCHAR(50)                     NOT NULL DEFAULT 'updated_at',
    updated_at              TIMESTAMP                       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 3. REFRESH_TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id          CHAR(36)        NOT NULL,
    user_id     CHAR(36)        NOT NULL,
    token_hash  VARCHAR(512)    NOT NULL,
    expires_at  TIMESTAMP       NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at  TIMESTAMP       NULL,        -- NULL = chưa bị thu hồi

    PRIMARY KEY (id),
    INDEX idx_rt_token_hash (token_hash),
    INDEX idx_rt_user_id    (user_id),

    CONSTRAINT fk_rt_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 4. NOTES
-- ============================================================
CREATE TABLE notes (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    title               VARCHAR(1000)   NULL,
    content             JSON            NULL,       -- block-based content
    content_text        TEXT            NULL,       -- plain-text extract để full-text search
    type                VARCHAR(20)     NOT NULL DEFAULT 'text',   -- 'text' | 'todo'
    color               VARCHAR(20)     NOT NULL DEFAULT 'default',
    is_pinned           BOOLEAN         NOT NULL DEFAULT FALSE,
    is_archived         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_trashed          BOOLEAN         NOT NULL DEFAULT FALSE,
    position            VARCHAR(255)    NOT NULL DEFAULT 'a0',     -- LexoRank
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    server_updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    client_updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trashed_at          TIMESTAMP       NULL,       -- auto-xóa sau 7 ngày

    PRIMARY KEY (id),
    INDEX idx_notes_user_id (user_id),

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT chk_note_type CHECK (
        type IN ('text', 'todo')
    ),

    -- is_pinned / is_archived / is_trashed loại trừ nhau
    CONSTRAINT chk_note_state CHECK (
        (CAST(is_pinned   AS UNSIGNED)
       + CAST(is_archived AS UNSIGNED)
       + CAST(is_trashed  AS UNSIGNED)) <= 1
    )
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 5. TAGS
-- ============================================================
CREATE TABLE tags (
    id          CHAR(36)        NOT NULL,
    owner_id    CHAR(36)        NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    is_deleted  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_owner_name (owner_id, name),     -- mỗi user không có tag trùng tên

    CONSTRAINT fk_tags_owner
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 6. NOTE_TAGS  (N-N: NOTES ↔ TAGS)
-- ============================================================
CREATE TABLE note_tags (
    note_id     CHAR(36)    NOT NULL,
    tag_id      CHAR(36)    NOT NULL,
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (note_id, tag_id),
    INDEX idx_note_tags_tag_id (tag_id),    -- tăng tốc "lấy tất cả note của tag X"

    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 7. NOTE_COLLABORATORS
-- ============================================================
CREATE TABLE note_collaborators (
    id          CHAR(36)    NOT NULL,
    note_id     CHAR(36)    NOT NULL,
    user_id     CHAR(36)    NOT NULL,
    invited_by  CHAR(36)    NOT NULL,

    -- Trạng thái riêng phía CTV, không đồng bộ với chủ note
    is_pinned   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN     NOT NULL DEFAULT FALSE,
    is_trashed  BOOLEAN     NOT NULL DEFAULT FALSE,

    accepted_at TIMESTAMP   NULL,       -- NULL = chưa chấp nhận lời mời
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_note_collaborators (note_id, user_id),
    INDEX idx_nc_user_trashed (user_id, is_trashed),    -- danh sách note cộng tác của 1 user
    INDEX idx_nc_note_id      (note_id),                -- danh sách CTV của 1 note

    CONSTRAINT fk_nc_note
        FOREIGN KEY (note_id)    REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_nc_user
        FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_nc_invited_by
        FOREIGN KEY (invited_by) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 8. MEDIA  (chỉ cho note type='text')
-- ============================================================
CREATE TABLE media (
    id          CHAR(36)        NOT NULL,
    note_id     CHAR(36)        NOT NULL,
    uploaded_by CHAR(36)        NOT NULL,
    file_url    VARCHAR(2048)   NOT NULL,
    file_type   VARCHAR(100)    NOT NULL,   -- image/png, video/mp4, ...
    file_size   INT             NOT NULL,   -- bytes
    is_deleted  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,    -- thứ tự xuất hiện trong note
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_media_note_id (note_id),

    CONSTRAINT fk_media_note
        FOREIGN KEY (note_id)     REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_media_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 9. REMINDERS  (chỉ cho note type='text'; 1 note — 1 user = 1 reminder)
-- ============================================================
CREATE TABLE reminders (
    id          CHAR(36)                                        NOT NULL,
    note_id     CHAR(36)                                        NOT NULL,
    user_id     CHAR(36)                                        NOT NULL,
    remind_at   TIMESTAMP                                       NOT NULL,
    repeat_type ENUM('none','daily','weekly','monthly')         NOT NULL DEFAULT 'none',
    is_notified BOOLEAN                                         NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN                                         NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMP                                       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_reminders_note_user (note_id, user_id),   -- 1 note chỉ có 1 reminder / user

    CONSTRAINT fk_reminders_note
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_reminders_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 10. TODO_ITEMS  (chỉ cho note type='todo')
--     Self-reference cho sub-task (tối đa 1 cấp — validate ở Django)
-- ============================================================
CREATE TABLE todo_items (
    id          CHAR(36)                                    NOT NULL,
    note_id     CHAR(36)                                    NOT NULL,
    parent_id   CHAR(36)                                    NULL,       -- NULL = task chính
    title       VARCHAR(255)                                NULL,
    content     TEXT                                        NULL,
    is_completed BOOLEAN                                    NOT NULL DEFAULT FALSE,
    position    VARCHAR(255)                                NOT NULL,   -- LexoRank trong phạm vi cùng parent
    remind_at   TIMESTAMP                                   NULL,
    repeat_type ENUM('none','daily','weekly','monthly')     NOT NULL DEFAULT 'none',
    is_notified BOOLEAN                                     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP                                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP                                   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_todo_note_id   (note_id),
    INDEX idx_todo_parent_id (parent_id),

    CONSTRAINT fk_todo_note
        FOREIGN KEY (note_id)   REFERENCES notes(id)      ON DELETE CASCADE,
    CONSTRAINT fk_todo_parent
        FOREIGN KEY (parent_id) REFERENCES todo_items(id) ON DELETE CASCADE,

    -- Phải có ít nhất title hoặc content
    CONSTRAINT chk_title_or_content CHECK (
        title IS NOT NULL OR content IS NOT NULL
    )
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 11. NOTE_VERSIONS  (snapshot JSON, giữ 20 bản gần nhất — logic ở Django)
-- ============================================================
CREATE TABLE note_versions (
    id      CHAR(36)        NOT NULL,
    note_id CHAR(36)        NOT NULL,
    title   VARCHAR(1000)   NULL,       -- snapshot tiêu đề
    content JSON            NULL,       -- snapshot toàn bộ blocks (hoặc serialize todo_items)
    saved_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_nv_note_id (note_id),

    CONSTRAINT fk_nv_note
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================
-- 12. NOTE_VERSION_EDITORS  (N-N: NOTE_VERSIONS ↔ USERS)
-- ============================================================
CREATE TABLE note_version_editors (
    version_id  CHAR(36)    NOT NULL,
    user_id     CHAR(36)    NOT NULL,

    PRIMARY KEY (version_id, user_id),

    CONSTRAINT fk_nve_version
        FOREIGN KEY (version_id) REFERENCES note_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_nve_user
        FOREIGN KEY (user_id)    REFERENCES users(id)         ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
