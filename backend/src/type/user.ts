import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// usersテーブルのORMマッピング
@Entity('users')
export class UserEntity {
  // DB側でDEFAULT gen_random_uuid()を設定済み
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId?: string;

  @Column({ name: 'user_name', type: 'varchar', length: 100 })
  userName: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'role_type', type: 'varchar', length: 20 })
  roleType: 'sales' | 'leader' | 'admin';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt?: Date;
}
