import {Controller,Get,Post,Param,Body,Delete,ParseIntPipe,UseGuards,BadRequestException,} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PostService } from './post.service';
import { PostResponseDto } from './responseDto/post-response.dto';

import {ApiTags,ApiBearerAuth,ApiOperation,ApiOkResponse,ApiCreatedResponse,ApiBadRequestResponse,ApiUnauthorizedResponse,ApiParam,ApiBody,} from '@nestjs/swagger';

@ApiTags('posts')
@ApiBearerAuth() 
@UseGuards(AccessTokenGuard)
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('posts')
export class PostController {
  constructor(private readonly postsService: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({ type: PostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID from token' })
  async create(
    @GetUser('sub') userId: any,
    @Body() body: CreatePostDto,
  ): Promise<PostResponseDto> {
    const id = Number(userId);
    if (isNaN(id)) throw new BadRequestException('Invalid user ID from token');
    return this.postsService.create({ ...body, user_id: id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts visible to the user' })
  @ApiOkResponse({ type: PostResponseDto, isArray: true })
  async getAllPost(@GetUser('sub') userId: number): Promise<PostResponseDto[]> {
    return this.postsService.getAllPost(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get all posts created by the current user' })
  @ApiOkResponse({ type: PostResponseDto, isArray: true })
  async getUserAllPosts(
    @GetUser('sub') userId: number,
  ): Promise<PostResponseDto[]> {
    return this.postsService.getUserAllPosts(userId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Post deleted' })
  async deleteById(
    @GetUser('sub') userId: number, // kept for guard context; not used here
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.deleteById(id);
  }

  @Post('toggle-like/:postId')
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiParam({ name: 'postId', type: Number })
  @ApiOkResponse({ type: PostResponseDto })
  async toggleLike(
    @GetUser('sub') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postsService.toggleLike(userId, postId);
  }
}
