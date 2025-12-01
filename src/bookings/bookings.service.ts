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

  async createBooking(userId: string, createBookingDto: CreateBookingDto): Promise<Booking[]> {
    const { seatIds, passenger_name, passenger_email } = createBookingDto;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException('At least one seat must be selected');
    }

    // Find all seats with user relation
    const seats = await this.seatsRepository.find({
      where: seatIds.map(id => ({ id })),
      relations: ['user', 'schedule', 'schedule.route'],
    });

    if (seats.length !== seatIds.length) {
      throw new BadRequestException('One or more seats not found');
    }

    // Verify all seats are LOCKED
    const unlockedSeats = seats.filter(seat => seat.status !== SeatStatus.LOCKED);
    if (unlockedSeats.length > 0) {
      throw new BadRequestException(`Seats ${unlockedSeats.map(s => s.seat_number).join(', ')} are not locked`);
    }

    // Verify all seats are locked by the requesting user
    const otherUserSeats = seats.filter(seat => !seat.user || seat.user.id !== userId);
    if (otherUserSeats.length > 0) {
      throw new ForbiddenException('Some seats are locked by another user');
    }

    // Check if user is verified
    const user = await this.seatsRepository.manager.findOne(User, { 
      where: { id: userId } 
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Please verify your identity before purchasing tickets');
    }

    // Create bookings for all seats
    const bookings: Booking[] = [];
    
    for (const seat of seats) {
      const booking = this.bookingsRepository.create({
        user: { id: userId } as User,
        seat: seat,
        passenger_name,
        passenger_email,
      });
      const savedBooking = await this.bookingsRepository.save(booking);
      bookings.push(savedBooking);

      // Update seat status to SOLD
      seat.status = SeatStatus.SOLD;
      await this.seatsRepository.save(seat);

      // Clear Redis lock
      const lockKey = `seat_lock:${seat.id}`;
      await this.redis.del(lockKey);
    }

    return bookings;
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
