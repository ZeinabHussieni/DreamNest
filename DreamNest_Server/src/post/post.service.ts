import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { DashboardGateway } from 'src/dashboard/gateway/dashboard.gateway'; 
import { PostResponseDto } from './responseDto/post-response.dto';

import { Post as PrismaPost, User } from '@prisma/client';

type PostWithUser = PrismaPost & {
  user?: { id: number; userName: string; profilePicture: string | null };
  _count?: { likes: number };
};


@Injectable()
export class PostService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService, 
        private readonly dashboardGateway: DashboardGateway,
    ) {}

    async create(data: { content: string; user_id: number }): Promise<PostResponseDto> {
        try {
            const post = await this.prisma.post.create({
                data: {
                    content: data.content,
                    user: { connect: { id: data.user_id } },
                },
            });
            //this for websocket dashboard
            await this.dashboardGateway.emitDashboardUpdate(data.user_id);
            return this.formatPost(post);
        } catch (err) {
            console.log(err);
            throw new BadRequestException('Post creation failed');
        }
    }

    async getAllPost(viewerId: number): Promise<PostResponseDto[]> {
      try {
         const posts = await this.prisma.post.findMany({
         include: {
              user: { select: { id: true, userName: true, profilePicture: true } },
              _count: { select: { likes: true } },          
              likes: {                                     
                 where: { user_id: viewerId },
                 select: { id: true },
                 take: 1,
               },
           },
              orderBy: { createdAt: 'desc' },
            });

            return posts.map((p) => ({
               id: p.id,
               content: p.content,
               user_id: p.user_id,
               createdAt: p.createdAt,
               updatedAt: p.updatedAt,
               user: p.user,
               likeCount: p._count.likes,
               viewerLiked: p.likes.length > 0,
           }));
        } catch {
            throw new InternalServerErrorException('Failed to fetch posts');
        }
    }

   async getUserAllPosts(ownerId: number, viewerId: number): Promise<PostResponseDto[]> {
        try {
            const posts = await this.prisma.post.findMany({
            where: { user_id: ownerId },
            include: {
           _count: { select: { likes: true } },
           likes: {
              where: { user_id: viewerId }, 
              select: { id: true },
              take: 1,
            },
        },
           orderBy: { createdAt: 'desc' },
        });

       return posts.map((p) => ({
         id: p.id,
         content: p.content,
         user_id: p.user_id,
         createdAt: p.createdAt,
         updatedAt: p.updatedAt,
         likeCount: p._count.likes,
         viewerLiked: p.likes.length > 0,
        }));
      } catch {
      throw new InternalServerErrorException('Failed to fetch user posts');
      }
    }
    
    async deleteById(id:number): Promise<{success:boolean}>{
        try{
           const post= await this.prisma.post.delete({where:{id}});

            //this for websocket dashboard
            await this.dashboardGateway.emitDashboardUpdate(post.user_id);
            return{success:true};
        }catch(err){
            throw new NotFoundException('Post not found');
        }
    }

  async toggleLike(userId: number, postId: number): Promise<{ liked: boolean; likeCount: number }> {
        try {
         const post = await this.prisma.post.findUnique({ where: { id: postId }, include: { user: true } });
         if (!post) throw new NotFoundException('Post not found');
         const existingLike = await this.prisma.postLike.findUnique({
             where: {
                  user_id_post_id: {
                  user_id: userId,
                  post_id: postId,
                 },
               },
           });

           let liked: boolean;

           if (existingLike) {

             await this.prisma.postLike.delete({ where: { id: existingLike.id } });
             liked = false;
            } else {

               await this.prisma.postLike.create({
                data: {
                 user: { connect: { id: userId } },
                 post: { connect: { id: postId } },
               },
              });
              liked = true;
             const actor = await this.prisma.user.findUnique({
               where: { id: userId },
               select: { userName: true },
              });

            await this.notificationService.createAndPush({
            type: 'LIKE_POST',
            userId: post.user_id,     
            actorId: userId,          
            postId,
            content: `${actor?.userName ?? 'Someone'} liked your post`,
         });
       }
       const likeCount = await this.prisma.postLike.count({ where: { post_id: postId } });
       return { liked, likeCount };
      } catch (err) {
        console.error(err);
        throw new BadRequestException('Failed to toggle like');
      }
  }
    

  private formatPost(post: PostWithUser): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      user_id: post.user_id,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user
        ? {
            id: post.user.id,
            userName: post.user.userName,
            profilePicture: post.user.profilePicture,
          }
        : undefined,
   
    };
  }


}
