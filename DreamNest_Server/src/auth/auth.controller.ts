import { Body, Controller, Get, HttpCode, Post,Query,Req, UseGuards ,BadRequestException,NotFoundException,InternalServerErrorException, UploadedFile, UseInterceptors} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      return await this.auth.register(
        dto.firstName,
        dto.lastName,
        dto.userName,
        dto.email,
        dto.password,
        file?.filename,
      );
    } catch (error) {
      if (error.status === 401) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.auth.login(dto.identifier, dto.password);
    } catch (error) {
      if (error.status === 401) {
        throw error;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    try {
      const user = req.user as any;
      return await this.auth.logout(user.sub);
    } catch {
      throw new InternalServerErrorException('Logout failed');
    }
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async me(@Req() req: Request) {
    return req.user;
  }

  @Get('getUser')
  async findUser(@Query('id') id: string) {
    if (!id) throw new BadRequestException('User ID is required');
    try {
      return await this.auth.getUser(Number(id));
    } catch(err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: Request) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new BadRequestException('Authorization header missing');

      const token = authHeader.replace('Bearer ', '');
      const user = req.user as any;

      return await this.auth.refresh(user.sub, user.email, token);
    } catch (error) {
      if (error.status === 401) {
        throw error;
      }
      throw new InternalServerErrorException('Token refresh failed');
    }
  }
}