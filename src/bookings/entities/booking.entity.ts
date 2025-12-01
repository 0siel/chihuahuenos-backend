import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Seat } from '../../seats/entities/seat.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Seat)
  seat: Seat;

  @CreateDateColumn()
  booking_date: Date;

  @Column()
  passenger_name: string;

  @Column()
  passenger_email: string;
}
