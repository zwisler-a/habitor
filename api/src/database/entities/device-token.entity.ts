import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'device_tokens' })
export class DeviceTokenEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  user_id!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'text' })
  platform!: string;

  @Column({ type: 'datetime' })
  last_seen_at!: Date;
}
