import { Controller, Get, Post, Param, Body, Delete, ParseIntPipe, UseGuards, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('goals')
@UseGuards(AccessTokenGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}


  @Post('create_goal')
@UseInterceptors(
  FileInterceptor('visionBoard', {
    storage: diskStorage({
      destination: './storage/private/visionBoard',
      filename: (_, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }),
)
async create(
  @GetUser('sub') userId: number,
  @Body() body: CreateGoalDto,
  @UploadedFile() file?: Express.Multer.File,
) {
  return this.goalsService.createGoalWithAI({
    ...body,
    user_id: userId,
    vision_board_filename: file?.filename,
  });
}


  @Get()
  async getAllByUser(@GetUser('sub') userId: number) {
    return this.goalsService.getAllByUserId(userId);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.goalsService.findById(id);
  }

  @Delete(':id')
  async deleteById(
    @GetUser('sub') userId: number, 
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.goalsService.deleteById(id);
  }

  @Get('status/:status')
  async getByStatus(
    @GetUser('sub') userId: number,
    @Param('status') status: 'completed' | 'in-progress',
  ) {
    return this.goalsService.getGoalsByStatus(userId, status);
  }
}
