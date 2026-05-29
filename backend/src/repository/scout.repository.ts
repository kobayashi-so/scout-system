import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateScoutInput,
  ScoutDetail,
  ScoutEntity,
  ScoutStatus,
} from '../type/scout';

@Injectable()
export class ScoutRepository {
  constructor(
    @InjectRepository(ScoutEntity)
    private readonly repository: Repository<ScoutEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<ScoutEntity[]> {
    const rows = await this.repository.query(
      `SELECT id, created_at, creator, title, body, status, first_approver_id, second_approver_id
       FROM scouts
       ORDER BY created_at DESC`,
    );

    return rows.map((row: any) => this.mapRowToEntity(row));
  }

  async findById(scoutId: string): Promise<ScoutEntity | null> {
    const rows = await this.repository.query(
      `SELECT id, created_at, creator, title, body, status, first_approver_id, second_approver_id
       FROM scouts
       WHERE id = $1
       LIMIT 1`,
      [scoutId],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  async findDetailById(scoutId: string): Promise<ScoutDetail | null> {
    // レビュー画面表示のため、scout本体と求人情報を1クエリで取得
    const rows = await this.repository.query(
      `SELECT
         s.id,
         s.created_at,
         s.creator,
         s.title,
         s.body,
         s.status,
         s.first_approver_id,
         s.second_approver_id,
         r.company_name,
         r.job_category,
         r.job_description,
         r.required_skills,
         r.work_location,
         r.salary_info,
         r.job_appeal,
         r.tone
       FROM scouts s
       LEFT JOIN scout_job_requirements r ON r.scout_id = s.id
       WHERE s.id = $1
       LIMIT 1`,
      [scoutId],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      ...this.mapRowToEntity(row),
      requirement: row.company_name
        ? {
            companyName: row.company_name,
            jobCategory: row.job_category,
            jobDescription: row.job_description,
            requiredSkills: row.required_skills,
            workLocation: row.work_location,
            salaryInfo: row.salary_info,
            jobAppeal: row.job_appeal,
            tone: row.tone,
          }
        : null,
    } as ScoutDetail;
  }

  async saveWithRequirement(
    scout: ScoutEntity,
    input: CreateScoutInput,
  ): Promise<ScoutEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const insertedScouts = await queryRunner.query(
        `INSERT INTO scouts (id, creator, title, body, status, first_approver_id, second_approver_id)
         VALUES ($1, $2, $3, $4, $5, NULL, NULL)
         RETURNING *`,
        [scout.id, scout.creator, scout.title, scout.body, scout.status],
      );

      const createdScout = insertedScouts[0];
      const r = input.requirement;

      await queryRunner.query(
        `INSERT INTO scout_job_requirements
         (scout_id, company_name, job_category, job_description, required_skills, work_location, salary_info, job_appeal, tone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          scout.id,
          r.companyName.trim(),
          r.jobCategory.trim(),
          r.jobDescription.trim(),
          r.requiredSkills.trim(),
          r.workLocation.trim(),
          r.salaryInfo.trim(),
          r.jobAppeal.trim(),
          input.tone,
        ],
      );

      await queryRunner.commitTransaction();
      return createdScout;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveByLeader(scoutId: string, approverId: string): Promise<ScoutEntity | null> {
    // 楽観的制御: WHEREで現在statusも条件化し、同時更新競合を防ぐ
    const rows = await this.repository.query(
      `UPDATE scouts
       SET status = $2,
           first_approver_id = $3
       WHERE id = $1
         AND status = $4
       RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id`,
      [scoutId, 'waiting_admin', approverId, 'waiting_leader'],
    );

    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  async finalApprove(scoutId: string, approverId: string): Promise<ScoutEntity | null> {
    // 楽観的制御: waiting_adminのときのみapprovedへ遷移
    const rows = await this.repository.query(
      `UPDATE scouts
       SET status = $2,
           second_approver_id = $3
       WHERE id = $1
         AND status = $4
       RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id`,
      [scoutId, 'approved', approverId, 'waiting_admin'],
    );

    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  async remand(scoutId: string, currentStatus: ScoutStatus): Promise<ScoutEntity | null> {
    // 差戻しも現在status一致時のみ更新
    const rows = await this.repository.query(
      `UPDATE scouts
       SET status = $2
       WHERE id = $1
         AND status = $3
       RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id`,
      [scoutId, 'remanded', currentStatus],
    );

    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  private mapRowToEntity(row: any): ScoutEntity {
    return {
      id: row.id,
      createdAt: row.created_at,
      creator: row.creator,
      title: row.title,
      body: row.body,
      status: row.status as ScoutStatus,
      firstApproverId: row.first_approver_id,
      secondApproverId: row.second_approver_id,
    } as ScoutEntity;
  }
}