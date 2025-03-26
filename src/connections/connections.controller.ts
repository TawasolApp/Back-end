import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
  Body,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get('/users')
  @HttpCode(HttpStatus.OK)
  async searchUsers(
    @Req() request: Request,
    @Query('name') name?: string,
    @Query('company') company?: string,
    @Query('industry') industry?: string,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!name && !company && !industry) {
        throw new BadRequestException(
          'At least one filter (name or company or industry) must be provided.',
        );
      }
      name = name?.trim();
      company = company?.trim();
      industry = industry?.trim();
      return await this.connectionsService.searchUsers(name, company, industry);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of users.',
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async requestConnection(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const sendingUserId = request.user['sub'];
      return await this.connectionsService.requestConnection(
        sendingUserId,
        createRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to request connection.');
    }
  }

  @Patch('/:userId')
  @HttpCode(HttpStatus.OK)
  async updateConnection(
    @Param('userId') sendingUserId: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(sendingUserId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }

      const receivingUserId = request.user['sub'];
      return await this.connectionsService.updateConnection(
        sendingUserId,
        receivingUserId,
        updateRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to accept connection request.',
      );
    }
  }

  @Delete('/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConnection(
    @Param('userId') requestUserId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(requestUserId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      const userId = request.user['sub'];
      await this.connectionsService.removeConnection(userId, requestUserId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove connection.');
    }
  }

  @Get('/list')
  async getConnections(@Req() request: Request) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = request.user['sub'];
      const connections = await this.connectionsService.getConnections(userId);
      return connections;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of connections.',
      );
    }
  }

  @Get('/pending')
  async getPendingRequests(@Req() request: Request) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = request.user['sub'];
      const pendingRequests =
        await this.connectionsService.getPendingRequests(userId);
      return pendingRequests;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of pending connection requests.',
      );
    }
  }

  @Get('/sent')
  async getSentRequests(@Req() request: Request) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = request.user['sub'];
      const sentRequests =
        await this.connectionsService.getSentRequests(userId);
      return sentRequests;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of sent connection requests.',
      );
    }
  }

  @Post('/follow')
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const sendingUserId = request.user['sub'];
      return await this.connectionsService.follow(
        sendingUserId,
        createRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to follow user.');
    }
  }

  @Delete('/unfollow/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @Param('userId') receivingUserId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(receivingUserId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      const sendingUserId = request.user['sub'];
      return await this.connectionsService.unfollow(
        sendingUserId,
        receivingUserId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unfollow user.');
    }
  }

  @Get('/followers')
  async getFollowers(@Req() request: Request) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = request.user['sub'];
      const followers = await this.connectionsService.getFollowers(userId);
      return followers;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of followers.',
      );
    }
  }

  @Get('/following')
  async getFollowing(@Req() request: Request) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = request.user['sub'];
      const following = await this.connectionsService.getFollowing(userId);
      return following;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of followed users.',
      );
    }
  }
}
