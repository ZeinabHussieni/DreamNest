import {Body, Controller, Get, HttpCode,Post, Query, Req, UseGuards, Param, Res,BadRequestException, UploadedFile, UseInterceptors,} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { join } from 'path';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type {Request } from 'express';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthResponseDto } from './responseDto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  //register
  @Post('register')
  async register(
    @Body() dto: RegisterDto
  ): Promise<AuthResponseDto> {
    const result = await this.auth.register(
      dto.firstName,
      dto.lastName,
      dto.userName,
      dto.email,
      dto.password,
      dto.profilePictureBase64,
    );

    return result;
  }

  @Get('profile/:filename')
  async getProfile(@Param('filename') filename: string, @Res() res: Response) {
  const filePath = join(process.cwd(), 'storage/private/profile', filename);
  return res.sendFile(filePath);
}


  //login
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto>  {
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
  me(@GetUser('sub') user:  any): Promise<AuthResponseDto>  {
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
