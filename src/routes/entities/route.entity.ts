import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity()
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @ManyToOne(() => Location)
  origin: Location;

  @ManyToOne(() => Location)
  destination: Location;

  @Column('decimal')
  base_price: number;

  @OneToMany(() => Schedule, (schedule) => schedule.route)
  schedules: Schedule[];
}
