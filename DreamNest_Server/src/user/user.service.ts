import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdentifier(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { userName: identifier },
        ],
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmailOrUsername(email: string, username: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { userName: username }],
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    password: string;
    profilePicture?: string;
  }) {
    try {
      return await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          email: data.email,
          passwordHash: data.password,
          profilePicture: data.profilePicture || null,
        },
      });
    } catch (err) {
      throw new BadRequestException('User creation failed');
    }
  }

  async setRefreshToken(userId: number, refreshTokenHash: string | null) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash },
      });
    } catch (err) {
      throw new BadRequestException('Could not set refresh token');
    }
  }
}
