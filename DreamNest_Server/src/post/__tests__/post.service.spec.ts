import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { DashboardGateway } from '../../dashboard/gateway/dashboard.gateway';
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('PostService', () => {
  let service: PostService;

  const prisma = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    postLike: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const notificationService = {
    createAndPush: jest.fn(),
  };

  const dashboardGateway = {
    emitDashboardUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: DashboardGateway, useValue: dashboardGateway },
      ],
    }).compile();

    service = module.get(PostService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a post and emits dashboard update', async () => {
      const fake = {
        id: 10,
        content: 'hello',
        user_id: 1,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      prisma.post.create.mockResolvedValue(fake);

      const res = await service.create({ content: 'hello', user_id: 1 });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: { content: 'hello', user: { connect: { id: 1 } } },
      });
      expect(dashboardGateway.emitDashboardUpdate).toHaveBeenCalledWith(1);
      expect(res).toMatchObject({ id: 10, content: 'hello', user_id: 1 });
    });

    it('throws BadRequestException on prisma error', async () => {
      prisma.post.create.mockRejectedValue(new Error('DB fail'));
      await expect(service.create({ content: 'x', user_id: 2 }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllPost', () => {
    it('returns mapped posts with likeCount + viewerLiked', async () => {
      prisma.post.findMany.mockResolvedValue([
        {
          id: 1,
          content: 'A',
          user_id: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 5, userName: 'Z', profilePicture: null },
          _count: { likes: 3 },
          likes: [{ id: 99 }],
        },
        {
          id: 2,
          content: 'B',
          user_id: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 6, userName: 'Y', profilePicture: 'pp.png' },
          _count: { likes: 0 },
          likes: [],
        },
      ]);

      const res = await service.getAllPost(7);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        include: {
          user: { select: { id: true, userName: true, profilePicture: true } },
          _count: { select: { likes: true } },
          likes: { where: { user_id: 7 }, select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(res[0]).toMatchObject({ id: 1, likeCount: 3, viewerLiked: true });
      expect(res[1]).toMatchObject({ id: 2, likeCount: 0, viewerLiked: false });
    });

    it('wraps unknown errors into InternalServerErrorException', async () => {
      prisma.post.findMany.mockRejectedValue(new Error('boom'));
      await expect(service.getAllPost(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUserAllPosts', () => {
    it('filters by ownerId and maps viewerLiked', async () => {
      prisma.post.findMany.mockResolvedValue([
        {
          id: 3,
          content: 'C',
          user_id: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { likes: 5 },
          likes: [{ id: 1 }],
        },
      ]);

      const res = await service.getUserAllPosts(10, 11);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { user_id: 10 },
        include: {
          _count: { select: { likes: true } },
          likes: { where: { user_id: 11 }, select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(res[0]).toMatchObject({ id: 3, likeCount: 5, viewerLiked: true });
    });

    it('wraps unknown errors into InternalServerErrorException', async () => {
      prisma.post.findMany.mockRejectedValue(new Error('fail'));
      await expect(service.getUserAllPosts(1, 2)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteById', () => {
    it('deletes by id and emits dashboard update', async () => {
      prisma.post.delete.mockResolvedValue({ id: 9, user_id: 77 });

      const res = await service.deleteById(9);

      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(dashboardGateway.emitDashboardUpdate).toHaveBeenCalledWith(77);
      expect(res).toEqual({ success: true });
    });

    it('throws NotFoundException if delete fails', async () => {
      prisma.post.delete.mockRejectedValue(new Error('not found'));
      await expect(service.deleteById(123)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleLike', () => {
    it('unlikes if like exists', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 5, user: { id: 5 } });
      prisma.postLike.findUnique.mockResolvedValue({ id: 200 });
      prisma.postLike.count.mockResolvedValue(4);

      const res = await service.toggleLike(7, 1);

      expect(prisma.postLike.delete).toHaveBeenCalledWith({ where: { id: 200 } });
      expect(res).toEqual({ liked: false, likeCount: 4 });
      expect(notificationService.createAndPush).not.toHaveBeenCalled();
    });

    it('likes if none exists and notifies owner', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 2, user_id: 9, user: { id: 9 } });
      prisma.postLike.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ userName: 'Zanouba' });
      prisma.postLike.count.mockResolvedValue(10);

      const res = await service.toggleLike(7, 2);

      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: { user: { connect: { id: 7 } }, post: { connect: { id: 2 } } },
      });
      expect(notificationService.createAndPush).toHaveBeenCalledWith({
        type: 'LIKE_POST',
        userId: 9,
        actorId: 7,
        postId: 2,
        content: 'Zanouba liked your post',
      });
      expect(res).toEqual({ liked: true, likeCount: 10 });
    });

    it('throws BadRequestException if post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.toggleLike(1, 999)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on unexpected error', async () => {
      prisma.post.findUnique.mockRejectedValue(new Error('db'));
      await expect(service.toggleLike(1, 2)).rejects.toThrow(BadRequestException);
    });
  });
});
