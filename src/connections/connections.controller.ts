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

  /*
    searches for users:
    - applies at least one filter to users
    - filter is applied with partial matching and case insensitive
  */
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

  /*
    logged in user send a connection request to user with ID provided in DTO
  */
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

  /*
    logged in user accepts/ignores a connection request sent by the user with ID provided as route parameter
  */
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

  /*
    logged in user removes the connection between them and user with ID provided as route parameter
  */
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

  /*
    retrieves list of users connected with the logged in user
  */
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

  /*
    retrieves list of users who sent a connection request to logged in user and logged in user has yet to respond
  */
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

  /*
    retrieves list of users that received a connection request from logged in user and are yet to respond
  */
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

  /*
    logged in user follows user with ID provided in DTO
  */
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

  /*
    logged in user unfollows user with ID provided as route parameter
  */
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

  /*
    retrieves list of users who follow logged in user
  */
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

  /*
    retrieves list of users followed by logged in user
  */
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
