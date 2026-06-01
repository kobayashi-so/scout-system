import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../type/user";

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  // メールアドレスで1件検索（ログイン・重複チェックで利用）
  async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = await this.repository.query(
      "SELECT user_id, user_name, email, password, role_type, created_at, updated_at FROM users WHERE LOWER(BTRIM(email)) = LOWER(BTRIM($1)) LIMIT 1",
      [email],
    );

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findById(userId: string): Promise<UserEntity | null> {
    const rows = await this.repository.query(
      "SELECT user_id, user_name, email, password, role_type, created_at, updated_at FROM users WHERE user_id = $1 LIMIT 1",
      [userId],
    );

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  // usersテーブルへINSERTし、登録済みレコードを返す
  async createUser(input: {
    userName: string;
    email: string;
    password: string;
    roleType: "sales" | "leader" | "admin";
  }): Promise<UserEntity> {
    const rows = await this.repository.query(
      `INSERT INTO users (user_name, email, password, role_type)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, user_name, email, password, role_type, created_at, updated_at`,
      [input.userName, input.email, input.password, input.roleType],
    );

    return this.mapRowToEntity(rows[0]);
  }

  // ユーザー一覧を作成日時順で取得
  async findAll(): Promise<UserEntity[]> {
    const rows = await this.repository.query(
      `SELECT user_id, user_name, email, password, role_type, created_at, updated_at
       FROM users
       ORDER BY created_at ASC`,
    );

    return rows.map((row: any) => this.mapRowToEntity(row));
  }

  // ユーザーのrole_typeを更新
  async updateRole(
    userId: string,
    roleType: "sales" | "leader" | "admin",
  ): Promise<UserEntity | null> {
    const rows = await this.repository.query(
      `UPDATE users
       SET role_type = $2
       WHERE user_id = $1
       RETURNING user_id, user_name, email, password, role_type, created_at, updated_at`,
      [userId, roleType],
    );

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  // ユーザーの基本プロフィール（名前/メール/パスワード）を更新
  async updateProfile(
    userId: string,
    input: {
      userName: string;
      email: string;
      password: string;
    },
  ): Promise<UserEntity | null> {
    const rows = await this.repository.query(
      `UPDATE users
       SET user_name = $2,
           email = $3,
           password = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING user_id, user_name, email, password, role_type, created_at, updated_at`,
      [userId, input.userName, input.email, input.password],
    );

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  // ユーザーを物理削除
  async deleteById(userId: string): Promise<boolean> {
    const rows = await this.repository.query(
      `DELETE FROM users
       WHERE user_id = $1
       RETURNING user_id`,
      [userId],
    );

    return rows.length > 0;
  }

  // snake_caseのDB結果をアプリ側のcamelCaseへ変換
  private mapRowToEntity(row: any): UserEntity {
    return {
      userId: row.user_id,
      userName: row.user_name,
      email: row.email,
      password: row.password,
      roleType: row.role_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as UserEntity;
  }
}
