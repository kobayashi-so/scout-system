import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export const SCOUT_STATUSES = [
  'draft',
  'waiting_leader',
  'waiting_admin',
  'approved',
  'remanded',
] as const;

export type ScoutStatus = (typeof SCOUT_STATUSES)[number];
export type RoleType = 'sales' | 'leader' | 'admin';

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

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'draft' })
  status: ScoutStatus;

  @Column({ name: 'first_approver_id', type: 'uuid', nullable: true })
  firstApproverId?: string | null;

  @Column({ name: 'second_approver_id', type: 'uuid', nullable: true })
  secondApproverId?: string | null;
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
  status?: ScoutStatus;
  tone: 'カジュアル' | '熱意' | 'プロフェッショナル';
  requirement: ScoutJobRequirementInput;
}

export interface WorkflowActionInput {
  scoutId: string;
  userId: string;
}

export interface RemandInput extends WorkflowActionInput {
  comment: string;
}

export interface ScoutJobRequirement {
  companyName: string;
  jobCategory: string;
  jobDescription: string;
  requiredSkills: string;
  workLocation: string;
  salaryInfo: string;
  jobAppeal: string;
  tone: string;
}

export interface ScoutDetail extends ScoutEntity {
  requirement?: ScoutJobRequirement | null;
}

export interface UpdateRemandedScoutInput {
  // 差戻し編集画面で更新された本文情報
  title: string;
  body: string;
  // 再申請時に求人要件と同時保存するトーン
  tone: 'カジュアル' | '熱意' | 'プロフェッショナル';
  // 差戻し編集画面で再編集された求人情報
  requirement: ScoutJobRequirementInput;
}
