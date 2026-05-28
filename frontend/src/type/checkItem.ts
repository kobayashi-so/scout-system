//型定義
//評価基準・チェック項目のデータ定義
export interface checkItem {
  id: string; //項目ID　UUIDを想定
  checkTitle: string; //チェック項目名　nameから変更したもの
  display_order: number; //表示順のこと
  deleted_at: string | null; // 削除日時 (論理削除用、NULLなら有効データ)
}
