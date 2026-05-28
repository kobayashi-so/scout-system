import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateScoutInput, ScoutEntity } from '../type/scout';

@Injectable()
export class ScoutRepository {
  constructor(
    @InjectRepository(ScoutEntity)
    private readonly repository: Repository<ScoutEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<ScoutEntity[]> {
    return this.repository.query('SELECT * FROM scouts ORDER BY created_at DESC');
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
        `INSERT INTO scouts (id, creator, title, body, status)
         VALUES ($1, $2, $3, $4, $5)
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
}