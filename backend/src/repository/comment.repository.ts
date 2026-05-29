import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from '../type/comment';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repository: Repository<CommentEntity>,
  ) {}

  async createComment(input: {
    targetScoutId: string;
    authorId: string;
    content: string;
  }): Promise<CommentEntity> {
    const rows = await this.repository.query(
      `INSERT INTO comments (target_scout_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING comment_id, target_scout_id, author_id, content, created_at`,
      [input.targetScoutId, input.authorId, input.content],
    );

    return this.mapRowToEntity(rows[0]);
  }

  async findByScoutId(targetScoutId: string): Promise<CommentEntity[]> {
    // レビュー画面のコメント履歴表示用（新しい順）
    const rows = await this.repository.query(
      `SELECT comment_id, target_scout_id, author_id, content, created_at
       FROM comments
       WHERE target_scout_id = $1
       ORDER BY created_at DESC`,
      [targetScoutId],
    );

    return rows.map((row: any) => this.mapRowToEntity(row));
  }

  private mapRowToEntity(row: any): CommentEntity {
    return {
      commentId: row.comment_id,
      targetScoutId: row.target_scout_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
    } as CommentEntity;
  }
}
