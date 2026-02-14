import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'entry_values' })
export class EntryValueEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  entry_id!: string;

  @Column({ type: 'text' })
  field_key!: string;

  @Column({ type: 'boolean', nullable: true })
  value_bool!: boolean | null;

  @Column({ type: 'real', nullable: true })
  value_num!: number | null;

  @Column({ type: 'integer', nullable: true })
  value_duration_sec!: number | null;

  @Column({ type: 'text', nullable: true })
  value_text!: string | null;
}
