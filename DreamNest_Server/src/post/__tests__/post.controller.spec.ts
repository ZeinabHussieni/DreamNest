import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from '../post.controller';
import { PostService } from '../post.service';

describe('PostController', () => {
  let controller: PostController;
  const postsService = {
    create: jest.fn(),
    getAllPost: jest.fn(),
    getUserAllPosts: jest.fn(),
    deleteById: jest.fn(),
    toggleLike: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: postsService }],
    }).compile();

    controller = module.get(PostController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('converts userId to number and forwards to service', async () => {
      postsService.create.mockResolvedValue({ id: 1, content: 'x', user_id: 2 });
      const res = await controller.create('2' as any, { content: 'x' } as any);
      expect(postsService.create).toHaveBeenCalledWith({ content: 'x', user_id: 2 });
      expect(res).toEqual({ id: 1, content: 'x', user_id: 2 });
    });

    it('throws BadRequestException when sub is NaN', async () => {
      await expect(controller.create('NaN' as any, { content: 'x' } as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  it('getAllPost forwards to service', async () => {
    postsService.getAllPost.mockResolvedValue([{ id: 1 }]);
    const res = await controller.getAllPost(7 as any);
    expect(postsService.getAllPost).toHaveBeenCalledWith(7);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('getUserAllPosts uses same userId as owner+viewer', async () => {
    postsService.getUserAllPosts.mockResolvedValue([{ id: 3 }]);
    const res = await controller.getUserAllPosts(9 as any);
    expect(postsService.getUserAllPosts).toHaveBeenCalledWith(9, 9);
    expect(res).toEqual([{ id: 3 }]);
  });

  it('deleteById forwards to service', async () => {
    postsService.deleteById.mockResolvedValue({ success: true });
    const res = await controller.deleteById(5 as any, 123 as any);
    expect(postsService.deleteById).toHaveBeenCalledWith(123);
    expect(res).toEqual({ success: true });
  });

  it('toggleLike forwards to service', async () => {
    postsService.toggleLike.mockResolvedValue({ liked: true, likeCount: 1 });
    const res = await controller.toggleLike(7 as any, 22 as any);
    expect(postsService.toggleLike).toHaveBeenCalledWith(7, 22);
    expect(res).toEqual({ liked: true, likeCount: 1 });
  });
});
