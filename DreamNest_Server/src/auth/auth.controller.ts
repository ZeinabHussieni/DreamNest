import {Body,Controller,Get,HttpCode,Post,Query,Req,UseGuards,Param,Res,BadRequestException,} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { join } from 'path';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthResponseDto } from './responseDto/auth-response.dto';

import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiProduces,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';

class MeDto {
  @ApiProperty() id!: number;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() userName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() coins!: number;
  @ApiProperty({ nullable: true }) profilePicture!: string | null;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}


  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(
      dto.firstName,
      dto.lastName,
      dto.userName,
      dto.email,
      dto.password,
      dto.profilePictureBase64,
    );
  }


  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('profile/:filename')
  @ApiOperation({ summary: 'Download profile image' })
  @ApiParam({ name: 'filename', type: String, example: 'avatar-123.png' })
  @ApiProduces('application/octet-stream')
  async getProfile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'storage/private/profile', filename);
    return res.sendFile(filePath);
  }

 
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto.identifier, dto.password);
  }


  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user (invalidate refresh token)' })
  @ApiOkResponse({ description: 'Logged out' })
  async logout(@GetUser('sub') user: any) {
    const userId = user?.sub;
    return this.auth.logout(userId);
  }


  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: MeDto })
  async me(@GetUser('sub') userId: number) {
    const user = await this.auth.getUser(userId);
    const { id, firstName, lastName, userName, email, coins, profilePicture } = user;
    return { id, firstName, lastName, userName, email, coins, profilePicture };
  }


  @Get('getUser')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiQuery({ name: 'id', type: Number, required: true, example: 42 })
  @ApiOkResponse({ type: MeDto })
  @ApiBadRequestResponse({ description: 'User ID is required' })
  findUser(@Query('id') id: string) {
    if (!id) throw new BadRequestException('User ID is required');
    return this.auth.getUser(Number(id));
  }


  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access/refresh tokens' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Authorization header missing' })
  refresh(
    @GetUser('sub') userId: number,
    @GetUser('email') email: string,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new BadRequestException('Authorization header missing');
    const token = authHeader.replace('Bearer ', '');
    return this.auth.refresh(userId, email, token);
  }
}
