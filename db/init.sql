-- 1. スカウト文本体のテーブル
CREATE TABLE IF NOT EXISTS scouts (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creator VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'waiting_leader', 'waiting_admin', 'approved', 'remanded')),
  first_approver_id UUID NULL,
  second_approver_id UUID NULL
);

ALTER TABLE scouts ADD COLUMN IF NOT EXISTS first_approver_id UUID NULL;
ALTER TABLE scouts ADD COLUMN IF NOT EXISTS second_approver_id UUID NULL;

UPDATE scouts SET status = LOWER(status);

-- 2. 求人条件のテーブル
CREATE TABLE IF NOT EXISTS scout_job_requirements (
  id SERIAL PRIMARY KEY,
  scout_id VARCHAR(50) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  job_category VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  work_location VARCHAR(255) NOT NULL,
  salary_info VARCHAR(255) NOT NULL,
  job_appeal TEXT NOT NULL,
  tone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scout_id) REFERENCES scouts(id) ON DELETE CASCADE
);
-- ユーザーテーブル（初回起動時に自動作成）
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('sales', 'leader', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- メールアドレスの大文字小文字/前後空白差を同一扱いにして重複登録を防止
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique_idx
  ON users (LOWER(BTRIM(email)));

-- 差し戻しコメントテーブル
CREATE TABLE IF NOT EXISTS comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_scout_id VARCHAR(50) NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(user_id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 更新日時を自動付与するトリガー関数
CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_users_updated_at ON users;

CREATE TRIGGER trigger_set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();

-- 評価基準・チェック項目管理マスタテーブルの作成
CREATE TABLE IF NOT EXISTS check_items (
    id VARCHAR(36) PRIMARY KEY,               -- 項目ID (UUIDを想定)
    checkTitle VARCHAR(255) NOT NULL,         -- チェック項目名 (nameから変更したもの)
    display_order INT NOT NULL,               -- 表示順 (UIの並び順を制御)
    deleted_at TIMESTAMP NULL                 -- 削除日時 (論理削除用、NULLなら有効データ)
);
