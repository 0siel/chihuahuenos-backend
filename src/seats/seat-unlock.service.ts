import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Seat, SeatStatus } from './entities/seat.entity';
import Redis from 'ioredis';

@Injectable()
export class SeatUnlockService {
  private readonly logger = new Logger(SeatUnlockService.name);
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

  @Cron(CronExpression.EVERY_MINUTE)
  async unlockExpiredSeats() {
    const lockDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expirationTime = new Date(Date.now() - lockDuration);

    try {
      // Find all locked seats that have expired
      const expiredSeats = await this.seatsRepository.find({
        where: {
          status: SeatStatus.LOCKED,
          locked_at: LessThan(expirationTime),
        },
      });

      if (expiredSeats.length > 0) {
        this.logger.log(`Found ${expiredSeats.length} expired seat lock(s)`);

        for (const seat of expiredSeats) {
          // Remove Redis lock
          const lockKey = `seat_lock:${seat.id}`;
          await this.redis.del(lockKey);

          // Update database
          seat.status = SeatStatus.AVAILABLE;
          seat.locked_at = null as any;
          seat.user = null as any;
          await this.seatsRepository.save(seat);

          this.logger.log(`Unlocked expired seat: ${seat.id} (seat number: ${seat.seat_number})`);
        }

        this.logger.log(`Successfully unlocked ${expiredSeats.length} expired seat(s)`);
      }
    } catch (error) {
      this.logger.error('Error unlocking expired seats:', error);
    }
  }
}
