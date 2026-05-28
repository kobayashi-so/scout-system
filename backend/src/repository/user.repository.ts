import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../type/user';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  // メールアドレスで1件検索（ログイン・重複チェックで利用）
  async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = await this.repository.query(
      'SELECT user_id, user_name, email, password, role_type, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
      [email],
    );

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  // usersテーブルへINSERTし、登録済みレコードを返す
  async createUser(input: {
    userName: string;
    email: string;
    password: string;
    roleType: 'sales' | 'leader' | 'admin';
  }): Promise<UserEntity> {
    const rows = await this.repository.query(
      `INSERT INTO users (user_name, email, password, role_type)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, user_name, email, password, role_type, created_at, updated_at`,
      [input.userName, input.email, input.password, input.roleType],
    );

    return this.mapRowToEntity(rows[0]);
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
