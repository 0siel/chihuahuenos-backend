import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Seat, SeatStatus } from '../seats/entities/seat.entity';
import { User } from '../users/entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import Redis from 'ioredis';

@Injectable()
export class BookingsService {
  private redis: Redis;

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Seat)
    private seatsRepository: Repository<Seat>,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async createBooking(userId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
    const { seatId, passenger_name, passenger_email } = createBookingDto;

    // Find seat with user relation
    const seat = await this.seatsRepository.findOne({
      where: { id: seatId },
      relations: ['user', 'schedule', 'schedule.route'],
    });

    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    // Verify seat is LOCKED
    if (seat.status !== SeatStatus.LOCKED) {
      throw new BadRequestException('Seat is not locked. Please lock the seat before purchasing.');
    }

    // Verify seat is locked by the requesting user
    if (!seat.user || seat.user.id !== userId) {
      throw new ForbiddenException('This seat is locked by another user.');
    }

    // Create booking
    const booking = this.bookingsRepository.create({
      user: { id: userId } as User,
      seat: seat,
      passenger_name,
      passenger_email,
    });
    await this.bookingsRepository.save(booking);

    // Update seat status to SOLD
    seat.status = SeatStatus.SOLD;
    await this.seatsRepository.save(seat);

    // Clear Redis lock
    const lockKey = `seat_lock:${seatId}`;
    await this.redis.del(lockKey);

    return booking;
  }

  async findUserBookings(userId: string): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { user: { id: userId } },
      relations: ['seat', 'seat.schedule', 'seat.schedule.route', 'seat.schedule.route.origin', 'seat.schedule.route.destination'],
      order: { booking_date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['seat', 'seat.schedule', 'seat.schedule.route', 'seat.schedule.route.origin', 'seat.schedule.route.destination'],
    });
  }
}
