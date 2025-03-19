import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { RequestConnectionDto } from './dtos/request-connection.dto';
import { UpdateConnectionDto } from './dtos/update-connection.dto';
import { mapToGetConnectionDto } from './dtos/get-connections.mapper';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('/request')
  @HttpCode(201)
  async requestConnection(@Body() requestConnectionDto: RequestConnectionDto) {
    const { userId, tempUserId } = requestConnectionDto;
    return await this.connectionsService.requestConnection(tempUserId, userId); 
  }

  @Patch('/:connectionId')
  async acceptConnection(
    @Param('connectionId') connectionId: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ) {
    const { isAccept } = updateConnectionDto;
    return await this.connectionsService.updateConnection(connectionId, isAccept);
  }

  @Delete('/:connectionId')
  @HttpCode(204)
  async removeConnection(@Param('connectionId') connectionId: string) {
    await this.connectionsService.removeConnection(connectionId);
  }

  @Post('/follow')
  @HttpCode(201)
  async follow(@Body() requestConnectionDto: RequestConnectionDto) {
    const { userId, tempUserId } = requestConnectionDto;
    return await this.connectionsService.follow(tempUserId, userId);
  }

  @Get('/list')
  async getConnections(@Query('userId') userId: string) {
    const connections = await this.connectionsService.getConnections(userId);
    return connections.map(mapToGetConnectionDto);
  }

  @Get('/pending')
  async getPendingRequests(@Query('userId') userId: string) {
    const pendingRequests = await this.connectionsService.getPendingRequests(userId);
    return pendingRequests.map(mapToGetConnectionDto);
  }

  @Get('/sent')
  async getSentRequests(@Query('userId') userId: string) {
    const sentRequests = await this.connectionsService.getSentRequests(userId);
    return sentRequests.map(mapToGetConnectionDto);
  }
}
