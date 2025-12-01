import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { Seat } from '../../seats/entities/seat.entity';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Route, (route) => route.schedules)
  route: Route;

  @Column()
  departure_time: Date;

  @Column({ nullable: true })
  bus_id: string;

  @OneToMany(() => Seat, (seat) => seat.schedule)
  seats: Seat[];
}
