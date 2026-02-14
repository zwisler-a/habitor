import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { PrimitiveType } from '../../domain/primitives/primitive-field.model';

@Entity({ name: 'tracker_fields' })
export class TrackerFieldEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  tracker_id!: string;

  @Column({ type: 'text' })
  field_key!: string;

  @Column({ type: 'text' })
  primitive_type!: PrimitiveType;

  @Column({ type: 'text', nullable: true })
  unit!: string | null;

  @Column({ type: 'text', nullable: true })
  validation_json!: string | null;

  @Column({ type: 'text', nullable: true })
  target_json!: string | null;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;
}
