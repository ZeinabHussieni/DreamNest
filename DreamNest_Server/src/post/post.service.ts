import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { Post as PrismaPost } from '@prisma/client';


@Injectable()
export class PostService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService, 
    ) {}

    async create(data: { content: string; user_id: number }): Promise<PrismaPost> {
        try {
            const post = await this.prisma.post.create({
                data: {
                    content: data.content,
                    user: { connect: { id: data.user_id } },
                },
            });
            return this.formatPost(post);
        } catch (err) {
            console.log(err);
            throw new BadRequestException('Post creation failed');
        }
    }

    async getAllPost():Promise<PrismaPost[]>{
        try{
            const posts=await this.prisma.post.findMany();
            return posts.map(this.formatPost);
        }catch(err){
            throw new InternalServerErrorException('Failed to fetch posts');
        }
    }

    async getUserAllPosts(userId: number): Promise<PrismaPost[]>{
        try{
            const posts=await this.prisma.post.findMany({where: {user_id:userId}})
            return posts.map(this.formatPost)
        }catch(err){
            throw new InternalServerErrorException('Failed to fetch user posts');
        }
    }

    async deleteById(id:number): Promise<{success:boolean}>{
        try{
            await this.prisma.post.delete({where:{id}});
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
              await this.notificationService.createNotification({
              type: 'LIKE_POST',
              userId: post.user_id,      
              actorId: userId,          
              postId: postId,
              content: `${post.user.userName} liked your post`,
           });

            }

           const likeCount = await this.prisma.postLike.count({ where: { post_id: postId } });
           

           return { liked, likeCount };
       } catch (err) {
        console.error(err);
        throw new BadRequestException('Failed to toggle like');
      }
    }
    

    private formatPost(post: PrismaPost) {
        return {
            id: post.id,
            content: post.content,
            user_id: post.user_id,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        };
    }


}
