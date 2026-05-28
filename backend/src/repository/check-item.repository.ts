import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckItemEntity } from '../type/check-item';

@Injectable()
export class CheckItemRepository {
  constructor(
    @InjectRepository(CheckItemEntity)
    private readonly repository: Repository<CheckItemEntity>,
  ) {}

  async findAllActive(): Promise<CheckItemEntity[]> {
    return this.repository.query(
      `SELECT id, checktitle AS "checkTitle", display_order AS "displayOrder", deleted_at AS "deletedAt"
       FROM check_items
       WHERE deleted_at IS NULL
       ORDER BY display_order ASC`,
    );
  }

  async createWithNextOrder(id: string, checkTitle: string): Promise<CheckItemEntity> {
    return this.repository.manager.transaction(async (manager) => {
      const maxRows = await manager.query(
        `SELECT COALESCE(MAX(display_order), 0) AS max_order
         FROM check_items
         WHERE deleted_at IS NULL`,
      );
      const nextOrder = Number(maxRows[0]?.max_order ?? 0) + 1;

      await manager.query(
        `INSERT INTO check_items (id, checktitle, display_order, deleted_at)
         VALUES ($1, $2, $3, NULL)`,
        [id, checkTitle, nextOrder],
      );

      const rows = await manager.query(
        `SELECT id, checktitle AS "checkTitle", display_order AS "displayOrder", deleted_at AS "deletedAt"
         FROM check_items
         WHERE id = $1`,
        [id],
      );

      if (rows.length === 0) {
        throw new Error('Check item not found after insert');
      }

      return rows[0];
    });
  }

  async updateTitle(id: string, checkTitle: string): Promise<CheckItemEntity | null> {
    const rows = await this.repository.query(
      `UPDATE check_items
       SET checktitle = $2
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, checktitle AS "checkTitle", display_order AS "displayOrder", deleted_at AS "deletedAt"`,
      [id, checkTitle],
    );

    return rows[0] ?? null;
  }

  async softDeleteAndReorder(id: string): Promise<boolean> {
    return this.repository.manager.transaction(async (manager) => {
      const deletedRows = await manager.query(
        `UPDATE check_items
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [id],
      );

      if (deletedRows.length === 0) {
        return false;
      }

      const activeRows = await manager.query(
        `SELECT id
         FROM check_items
         WHERE deleted_at IS NULL
         ORDER BY display_order ASC, id ASC`,
      );

      for (let index = 0; index < activeRows.length; index += 1) {
        const row = activeRows[index];
        await manager.query(
          `UPDATE check_items
           SET display_order = $2
           WHERE id = $1`,
          [row.id, index + 1],
        );
      }

      return true;
    });
  }
}
