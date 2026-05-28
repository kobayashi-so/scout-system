import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('scouts')
export class ScoutEntity {
  @PrimaryColumn({ name: 'id' })
  id?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt?: Date;

  @Column({ name: 'creator', type: 'varchar', length: 100 })
  creator: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'body', type: 'text' })
  body: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'DRAFT' })
  status: string;
}

export interface ScoutJobRequirementInput {
  companyName: string;
  jobCategory: string;
  jobDescription: string;
  requiredSkills: string;
  workLocation: string;
  salaryInfo: string;
  jobAppeal: string;
}

export interface CreateScoutInput {
  creator: string;
  title: string;
  body: string;
  status?: string;
  tone: 'カジュアル' | '熱意' | 'プロフェッショナル';
  requirement: ScoutJobRequirementInput;
}
