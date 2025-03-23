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
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { RequestConnectionDto } from './dtos/request-connection.dto';
import { UpdateConnectionDto } from './dtos/update-connection.dto';
import { toGetConnectionDto } from './dtos/get-connections.mapper';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('/request/:userId')
  @HttpCode(HttpStatus.CREATED)
  async requestConnection(
    @Param('userId') requestUserId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(requestUserId)) {
        throw new BadRequestException('Invalid user ID format.');
      }
      const userId = request.user['sub'];
      return await this.connectionsService.requestConnection(
        userId,
        requestUserId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to request connection.');
    }
  }

  @Patch('/:connectionId')
  @HttpCode(HttpStatus.OK)
  async acceptConnection(
    @Param('connectionId') connectionId: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ) {
    try {
      if (!Types.ObjectId.isValid(connectionId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      return await this.connectionsService.updateConnection(
        connectionId,
        updateConnectionDto,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update connection request status.',
      );
    }
  }

  @Delete('/:connectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConnection(@Param('connectionId') connectionId: string) {
    try {
      if (!Types.ObjectId.isValid(connectionId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      await this.connectionsService.removeConnection(connectionId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove connection.');
    }
  }

  // remove temp user ID later, will extract from token
  // make userId route param
  @Post('/follow')
  @HttpCode(HttpStatus.CREATED)
  async follow(@Body() requestConnectionDto: RequestConnectionDto) {
    try {
      const { userId, tempUserId } = requestConnectionDto;
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format.');
      }
      return await this.connectionsService.follow(tempUserId, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove connection.');
    }
  }

  @Get('/list')
  async getConnections(@Query('userId') userId: string) {
    const connections = await this.connectionsService.getConnections(userId);
    return connections.map(toGetConnectionDto);
  }

  @Get('/pending')
  async getPendingRequests(@Query('userId') userId: string) {
    const pendingRequests =
      await this.connectionsService.getPendingRequests(userId);
    return pendingRequests.map(toGetConnectionDto);
  }

  @Get('/sent')
  async getSentRequests(@Query('userId') userId: string) {
    const sentRequests = await this.connectionsService.getSentRequests(userId);
    return sentRequests.map(toGetConnectionDto);
  }
}
