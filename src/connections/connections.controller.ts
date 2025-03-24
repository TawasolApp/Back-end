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
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ConnectionStatus } from './infrastructure/connection-status.enum';
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

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
      const { userId } = createRequestDto;
      const receivingUserId = userId;
      if (!Types.ObjectId.isValid(receivingUserId)) {
        throw new BadRequestException('Invalid user ID format.');
      }
      const sendingUserId = request.user['sub'];
      return await this.connectionsService.requestConnection(
        sendingUserId,
        receivingUserId,
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
    @Param('userId') receivingUserId: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(receivingUserId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      const { isAccept } = updateRequestDto;
      const status = isAccept
        ? ConnectionStatus.Connected
        : ConnectionStatus.Ignored;
      const sendingUserId = request.user['sub'];
      return await this.connectionsService.updateConnection(
        sendingUserId,
        receivingUserId,
        status,
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
      const { userId } = createRequestDto;
      const receivingUserId = userId;
      if (!Types.ObjectId.isValid(receivingUserId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      const sendingUserId = request.user['sub'];
      return await this.connectionsService.follow(
        sendingUserId,
        receivingUserId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to follow user.');
    }
  }

  @Post('/unfollow/:userId')
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

  // @Post('/request/:userId')
  // @HttpCode(HttpStatus.CREATED)
  // async requestConnection(
  //   @Param('userId') requestUserId: string,
  //   @Req() request: Request,
  // ) {
  //   try {
  //     if (!request.user) {
  //       throw new UnauthorizedException('User not authenticated');
  //     }
  //     if (!Types.ObjectId.isValid(requestUserId)) {
  //       throw new BadRequestException('Invalid user ID format.');
  //     }
  //     const userId = request.user['sub'];
  //     return await this.connectionsService.requestConnection(
  //       userId,
  //       requestUserId,
  //     );
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException('Failed to request connection.');
  //   }
  // }

  // @Patch('/:connectionId')
  // @HttpCode(HttpStatus.OK)
  // async acceptConnection(
  //   @Param('connectionId') connectionId: string,
  //   @Body() updateConnectionDto: UpdateConnectionDto,
  // ) {
  //   try {
  //     if (!Types.ObjectId.isValid(connectionId)) {
  //       throw new BadRequestException('Invalid connection ID format.');
  //     }
  //     return await this.connectionsService.updateConnection(
  //       connectionId,
  //       updateConnectionDto,
  //     );
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Failed to update connection request status.',
  //     );
  //   }
  // }

  // @Delete('/:connectionId')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async removeConnection(@Param('connectionId') connectionId: string) {
  //   try {
  //     if (!Types.ObjectId.isValid(connectionId)) {
  //       throw new BadRequestException('Invalid connection ID format.');
  //     }
  //     await this.connectionsService.removeConnection(connectionId);
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException('Failed to remove connection.');
  //   }
  // }

  // // remove temp user ID later, will extract from token
  // // make userId route param
  // @Post('/follow')
  // @HttpCode(HttpStatus.CREATED)
  // async follow(@Body() requestConnectionDto: RequestConnectionDto) {
  //   try {
  //     const { userId, tempUserId } = requestConnectionDto;
  //     if (!Types.ObjectId.isValid(userId)) {
  //       throw new BadRequestException('Invalid user ID format.');
  //     }
  //     return await this.connectionsService.follow(tempUserId, userId);
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException('Failed to remove connection.');
  //   }
  // }

  // @Get('/list')
  // async getConnections(@Query('userId') userId: string) {
  //   const connections = await this.connectionsService.getConnections(userId);
  //   return connections.map(toGetConnectionDto);
  // }

  // @Get('/pending')
  // async getPendingRequests(@Query('userId') userId: string) {
  //   const pendingRequests =
  //     await this.connectionsService.getPendingRequests(userId);
  //   return pendingRequests.map(toGetConnectionDto);
  // }

  // @Get('/sent')
  // async getSentRequests(@Query('userId') userId: string) {
  //   const sentRequests = await this.connectionsService.getSentRequests(userId);
  //   return sentRequests.map(toGetConnectionDto);
  // }
}
