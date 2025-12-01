import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { User } from '../../users/entities/user.entity';

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  SOLD = 'SOLD',
}

@Entity()
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seat_number: number;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column({ nullable: true })
  locked_at: Date;

  @ManyToOne(() => Schedule, (schedule) => schedule.seats)
  schedule: Schedule;

  @ManyToOne(() => User, { nullable: true })
  user: User;
}
