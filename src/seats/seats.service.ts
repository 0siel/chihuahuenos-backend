import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat, SeatStatus } from './entities/seat.entity';
import Redis from 'ioredis';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SeatsService {
  private redis: Redis;

  constructor(
    @InjectRepository(Seat)
    private seatsRepository: Repository<Seat>,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async findAll(): Promise<Seat[]> {
    return this.seatsRepository.find({ relations: ['schedule', 'schedule.route'] });
  }

  async findOne(id: string): Promise<Seat | null> {
    return this.seatsRepository.findOne({ where: { id }, relations: ['schedule'] });
  }

  async lockSeat(seatId: string, userId: string): Promise<boolean> {
    const seat = await this.findOne(seatId);
    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    if (seat.status === SeatStatus.SOLD) {
      throw new ConflictException('Seat already sold');
    }

    if (seat.status === SeatStatus.LOCKED && seat.user?.id !== userId) {
        // Check if lock is expired (e.g. 10 mins)
        const lockDuration = 10 * 60 * 1000;
        if (seat.locked_at && (new Date().getTime() - seat.locked_at.getTime() < lockDuration)) {
             throw new ConflictException('Seat is currently locked by another user');
        }
    }

    // Redis lock for strict concurrency
    const lockKey = `seat_lock:${seatId}`;
    const locked = await this.redis.set(lockKey, userId, 'PX', 600000, 'NX');

    // If redis lock fails, check if it's the same user re-locking or extending
    if (!locked) {
        const currentLockUser = await this.redis.get(lockKey);
        if (currentLockUser !== userId) {
             throw new ConflictException('Seat is currently locked by another user');
        }
    }

    // Update DB
    seat.status = SeatStatus.LOCKED;
    seat.locked_at = new Date();
    seat.user = { id: userId } as User;
    await this.seatsRepository.save(seat);

    return true;
  }
  
  async unlockSeat(seatId: string): Promise<void> {
      const lockKey = `seat_lock:${seatId}`;
      await this.redis.del(lockKey);
      
      const seat = await this.findOne(seatId);
      if (seat && seat.status === SeatStatus.LOCKED) {
          seat.status = SeatStatus.AVAILABLE;
          seat.locked_at = null as any;
          seat.user = null as any;
          await this.seatsRepository.save(seat);
      }
  }
}
