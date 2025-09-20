import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoinsController } from '../coins.controller';
import { CoinsService } from '../coins.service';

describe('CoinsController', () => {
  let controller: CoinsController;

  const svc = {
    runDailyDecay: jest.fn(),
    getLeaderboard: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinsController],
      providers: [{ provide: CoinsService, useValue: svc }],
    }).compile();

    controller = module.get(CoinsController);
  });

  describe('triggerDailyDecay', () => {
    it('parses valid date and forwards to service', async () => {
      svc.runDailyDecay.mockResolvedValue(undefined);
      const res = await controller.triggerDailyDecay({ date: '2025-02-02' } as any);
      expect(svc.runDailyDecay).toHaveBeenCalledWith(new Date('2025-02-02'));
      expect(res).toEqual({ ok: true });
    });

    it('passes undefined when no date provided', async () => {
      svc.runDailyDecay.mockResolvedValue(undefined);
      const res = await controller.triggerDailyDecay({} as any);
      expect(svc.runDailyDecay).toHaveBeenCalledWith(undefined);
      expect(res).toEqual({ ok: true });
    });

    it('throws BadRequest on invalid date', async () => {
      await expect(controller.triggerDailyDecay({ date: 'not-a-date' } as any))
        .rejects.toThrow(BadRequestException);
      expect(svc.runDailyDecay).not.toHaveBeenCalled();
    });
  });

  describe('leaderboard', () => {
    it('forwards numeric limit parsed from query', async () => {
      svc.getLeaderboard.mockResolvedValue({ items: [] });
      const res = await controller.leaderboard('7' as any);
      expect(svc.getLeaderboard).toHaveBeenCalledWith(7);
      expect(res).toEqual({ items: [] });
    });

    it('handles undefined limit', async () => {
      svc.getLeaderboard.mockResolvedValue({ items: [] });
      const res = await controller.leaderboard(undefined as any);
      expect(svc.getLeaderboard).toHaveBeenCalledWith(NaN); 
      expect(res).toEqual({ items: [] });
    });
  });
});
