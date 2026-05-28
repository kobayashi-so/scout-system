import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('check_items')
export class CheckItemEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'checktitle', type: 'varchar', length: 255 })
  checkTitle: string;

  @Column({ name: 'display_order', type: 'int' })
  displayOrder: number;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
