import { Controller, Get, Post, Param, Body, Delete, ParseIntPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PostService } from './post.service';
import { PostResponseDto } from './responseDto/post-response.dto';

@Controller('posts')
@UseGuards(AccessTokenGuard)
export class PostController {
    constructor(private readonly postsService:PostService){}

    @Post()
    async create(@GetUser('sub') userId:any,@Body() body:CreatePostDto): Promise<PostResponseDto>{
        const id=Number(userId);
        if(isNaN(id)) throw new BadRequestException('Invalid user ID from token');
        return this.postsService.create({...body,user_id:id});

    }

    @Get()
     async getAllPost(): Promise<PostResponseDto[]> {
     return this.postsService.getAllPost();
    }

   @Get('me')
     async getUserAllPosts(@GetUser('sub') userId: number): Promise<PostResponseDto[]> {
      return this.postsService.getUserAllPosts(userId);
    }

  @Delete(':id')
     async deleteById(@GetUser('sub') userId: number, @Param('id', ParseIntPipe) id: number) {
      return this.postsService.deleteById(id);
   }

   @Post('toggle-like/:postId')
   async toggleLike(
    @GetUser('sub') userId: number,
    @Param('postId', ParseIntPipe) postId: number
    ) {
   return this.postsService.toggleLike(userId, postId); 
   }

}

