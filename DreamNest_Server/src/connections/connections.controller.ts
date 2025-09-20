import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ConnectionResponseDto } from './responseDto/connection-response.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('connections')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user connections' })
  @ApiOkResponse({ type: ConnectionResponseDto, isArray: true })
  async getUserConnections(
    @GetUser('sub') userId: number,
  ): Promise<ConnectionResponseDto[]> {
    return this.connectionsService.getUserConnections(userId);
  }

  @Patch(':connectionId/accept')
  @ApiOperation({ summary: 'Accept a connection request' })
  @ApiParam({ name: 'connectionId', type: Number, example: 123 })
  async acceptConnection(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @GetUser('sub') userId: number,
  ) {
    return this.connectionsService.acceptConnection(connectionId, userId);
  }

  @Patch(':connectionId/reject')
  @ApiOperation({ summary: 'Reject a connection request' })
  @ApiParam({ name: 'connectionId', type: Number, example: 123 })
  async rejectConnection(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @GetUser('sub') userId: number,
  ) {
    return this.connectionsService.rejectConnection(connectionId, userId);
  }
}

