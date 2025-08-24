import {Body, Controller, Get, HttpCode,Post, Query, Req, UseGuards, BadRequestException, UploadedFile, UseInterceptors,} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express, Request } from 'express';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  //register
  @Post('register')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './storage/private/profile',
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
    const result = await this.auth.register(
      dto.firstName,
      dto.lastName,
      dto.userName,
      dto.email,
      dto.password,
      file?.filename,
    );

    return result;
  }

  //login
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.identifier, dto.password);
  }

  //logout
  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(@GetUser('sub') userId:  any) {
    return this.auth.logout(userId.sub);
  }
  
  //current user
  @UseGuards(AccessTokenGuard)
  @Get('me')
  me(@GetUser('sub') user:  any) {
    return user;
  }

  //user by id
  @Get('getUser')
  findUser(@Query('id') id: string) {
    if (!id) throw new BadRequestException('User ID is required');
    return this.auth.getUser(Number(id));
  }
  

  //refresh token
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@GetUser('sub') userId: number,
          @GetUser('email') email: string,  @Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new BadRequestException('Authorization header missing');

    const token = authHeader.replace('Bearer ', '');
    return this.auth.refresh(userId, email, token);
  }
}
