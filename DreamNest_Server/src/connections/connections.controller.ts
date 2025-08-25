import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AccessTokenGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  async getUserConnections(@GetUser('sub') userId: number) {
    return this.connectionsService.getUserConnections(userId);
  }

  @Patch(':connectionId/accept')
  async acceptConnection(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @GetUser('sub') userId: number
  ) {
    return this.connectionsService.acceptConnection(connectionId, userId);
  }

  @Patch(':connectionId/reject')
  async rejectConnection(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @GetUser('sub') userId: number
  ) {
    return this.connectionsService.rejectConnection(connectionId, userId);
  }
}
