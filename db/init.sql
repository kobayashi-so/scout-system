-- スカウト文テーブル（初回起動時に自動作成）
CREATE TABLE IF NOT EXISTS scouts (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creator VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
);

-- 評価基準・チェック項目管理マスタテーブルの作成
CREATE TABLE IF NOT EXISTS check_items (
    id VARCHAR(36) PRIMARY KEY,               -- 項目ID (UUIDを想定)
    checkTitle VARCHAR(255) NOT NULL,         -- チェック項目名 (nameから変更したもの)
    display_order INT NOT NULL,               -- 表示順 (UIの並び順を制御)
    deleted_at TIMESTAMP NULL                 -- 削除日時 (論理削除用、NULLなら有効データ)
);