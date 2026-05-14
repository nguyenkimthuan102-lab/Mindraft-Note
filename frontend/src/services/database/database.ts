import * as SQLite from 'expo-sqlite';
export const db = SQLite.openDatabaseSync('mindraft.db');

// Khởi tạo các bảng cần thiết cho ứng dụng
db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS Settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);