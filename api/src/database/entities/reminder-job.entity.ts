import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'reminder_jobs' })
export class ReminderJobEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  tracker_id!: string;

  @Column({ type: 'datetime' })
  next_run_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  last_run_at!: Date | null;

  @Column({ type: 'text' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  last_error!: string | null;
}
