import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async create(payload: CreateUserDto): Promise<UserEntity> {
    const user = this.usersRepo.create({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      isActive: payload.isActive ?? true,
    });

    return this.usersRepo.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepo.find({
      order: { id: 'ASC' },
    });
  }
}
