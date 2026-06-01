import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateScoutInput,
  ScoutDetail,
  ScoutEntity,
  ScoutStatus,
  UpdateRemandedScoutInput,
} from '../type/scout';

@Injectable()
export class ScoutRepository {
  constructor(
    @InjectRepository(ScoutEntity)
    private readonly repository: Repository<ScoutEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(includeDeleted = false): Promise<ScoutEntity[]> {
    const rows = await this.repository.query(
      `SELECT id, created_at, creator, title, body, status, first_approver_id, second_approver_id, deleted_at
       FROM scouts
       WHERE ($1::boolean = true OR deleted_at IS NULL)
       ORDER BY created_at DESC`,
      [includeDeleted],
    );

    return rows.map((row: any) => this.mapRowToEntity(row));
  }

  async findById(scoutId: string): Promise<ScoutEntity | null> {
    const rows = await this.repository.query(
      `SELECT id, created_at, creator, title, body, status, first_approver_id, second_approver_id, deleted_at
       FROM scouts
       WHERE id = $1
         AND deleted_at IS NULL
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
         s.deleted_at,
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
         AND s.deleted_at IS NULL
       LIMIT 1`,
      [scoutId],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    // LEFT JOIN結果から、求人行が実在するかを値の有無で判定
    const hasRequirementRow = [
      row.company_name,
      row.job_category,
      row.job_description,
      row.required_skills,
      row.work_location,
      row.salary_info,
      row.job_appeal,
      row.tone,
    ].some((value) => value !== null && value !== undefined);

    const fallbackRequirement = {
      // 旧データで求人行が無い場合は、元文書(scouts)の情報を編集初期値として返す
      companyName: row.creator ?? '',
      jobCategory: row.title ?? '',
      jobDescription: row.body ?? '',
      requiredSkills: '',
      workLocation: '',
      salaryInfo: '',
      jobAppeal: '',
      tone: 'プロフェッショナル',
    };

    return {
      ...this.mapRowToEntity(row),
      requirement: hasRequirementRow
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
        : fallbackRequirement,
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
         AND deleted_at IS NULL
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
         AND deleted_at IS NULL
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
         AND deleted_at IS NULL
       RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id`,
      [scoutId, 'remanded', currentStatus],
    );

    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  async resubmitRemandedScout(
    scoutId: string,
    input: UpdateRemandedScoutInput,
  ): Promise<ScoutEntity | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 差戻し状態の文書だけ更新し、承認者情報は再申請時にクリアする
      const updatedRows = await queryRunner.query(
        `UPDATE scouts
         SET title = $2,
             body = $3,
             status = $4,
             first_approver_id = NULL,
             second_approver_id = NULL
         WHERE id = $1
           AND status = $5
           AND deleted_at IS NULL
         RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id`,
        [scoutId, input.title.trim(), input.body.trim(), 'waiting_leader', 'remanded'],
      );

      if (updatedRows.length === 0) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const r = input.requirement;
      // 求人情報は同一トランザクション内で更新して本文との不整合を防ぐ
      await queryRunner.query(
        `UPDATE scout_job_requirements
         SET company_name = $2,
             job_category = $3,
             job_description = $4,
             required_skills = $5,
             work_location = $6,
             salary_info = $7,
             job_appeal = $8,
             tone = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE scout_id = $1`,
        [
          scoutId,
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
      return this.mapRowToEntity(updatedRows[0]);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async softDelete(scoutId: string): Promise<ScoutEntity | null> {
    const rows = await this.repository.query(
      `UPDATE scouts
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND deleted_at IS NULL
       RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id, deleted_at`,
      [scoutId],
    );

    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  async restore(scoutId: string): Promise<ScoutEntity | null> {
    const rows = await this.repository.query(
      `UPDATE scouts
       SET deleted_at = NULL
       WHERE id = $1
         AND deleted_at IS NOT NULL
       RETURNING id, created_at, creator, title, body, status, first_approver_id, second_approver_id, deleted_at`,
      [scoutId],
    );

    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  async hardDelete(scoutId: string): Promise<boolean> {
    const rows = await this.repository.query(
      `DELETE FROM scouts
       WHERE id = $1
         AND deleted_at IS NOT NULL
       RETURNING id`,
      [scoutId],
    );

    return rows.length > 0;
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
      deletedAt: row.deleted_at,
    } as ScoutEntity;
  }
}