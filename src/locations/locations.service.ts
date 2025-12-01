import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
  ) {}

  create(name: string): Promise<Location> {
    const location = this.locationsRepository.create({ name });
    return this.locationsRepository.save(location);
  }

  findAll(): Promise<Location[]> {
    return this.locationsRepository.find();
  }

  findOne(id: string): Promise<Location | null> {
    return this.locationsRepository.findOne({ where: { id } });
  }
}
