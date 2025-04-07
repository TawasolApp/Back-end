import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  HttpCode,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
  Body,
  ValidationPipe,
  UsePipes,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ConnectionsService } from './connections.service';
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';
import { AddEndoresementDto } from './dtos/add-endorsement.dto';
import { validateId } from '../common/utils/id-validator';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get('/users')
  @HttpCode(HttpStatus.OK)
  async searchUsers(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('name') name?: string,
    @Query('company') company?: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!name && !company) {
      throw new BadRequestException(
        'At least one filter (name or company) must be provided.',
      );
    }
    name = name?.trim();
    company = company?.trim();
    return await this.connectionsService.searchUsers(
      page,
      limit,
      name,
      company,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async requestConnection(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const sendingUserId = request.user['sub'];
    return await this.connectionsService.requestConnection(
      sendingUserId,
      createRequestDto,
    );
  }

  @Delete('/:userId/pending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRequest(
    @Param('userId') receivingUserId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    validateId(receivingUserId, 'user');
    const sendingUserId = request.user['sub'];
    await this.connectionsService.removeRequest(sendingUserId, receivingUserId);
  }

  @Patch('/:userId')
  @HttpCode(HttpStatus.OK)
  async updateConnection(
    @Param('userId') sendingUserId: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    validateId(sendingUserId, 'user');
    const receivingUserId = request.user['sub'];
    await this.connectionsService.updateConnection(
      sendingUserId,
      receivingUserId,
      updateRequestDto,
    );
  }

  @Delete('/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeConnection(
    @Param('userId') requestUserId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    validateId(requestUserId, 'user');
    const userId = request.user['sub'];
    await this.connectionsService.removeConnection(userId, requestUserId);
  }

  @Get('/list')
  async getConnections(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('by', new DefaultValuePipe(1), ParseIntPipe) by: number,
    @Query('direction', new DefaultValuePipe(1), ParseIntPipe)
    direction: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    return await this.connectionsService.getConnections(
      userId,
      page,
      limit,
      by,
      direction,
    );
  }

  @Get('/pending')
  async getPendingRequests(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    return await this.connectionsService.getPendingRequests(
      userId,
      page,
      limit,
    );
  }

  @Get('/sent')
  async getSentRequests(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    const sentRequests = await this.connectionsService.getSentRequests(
      userId,
      page,
      limit,
    );
    return sentRequests;
  }

  @Get('/recommended')
  async getRecommendedUsers(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    const recommendedUsers = await this.connectionsService.getRecommendedUsers(
      userId,
      page,
      limit,
    );
    return recommendedUsers;
  }

  @Post('/follow')
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const sendingUserId = request.user['sub'];
    return await this.connectionsService.follow(
      sendingUserId,
      createRequestDto,
    );
  }

  @Delete('/unfollow/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @Param('userId') receivingUserId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    validateId(receivingUserId, 'user');
    const sendingUserId = request.user['sub'];
    return await this.connectionsService.unfollow(
      sendingUserId,
      receivingUserId,
    );
  }

  @Get('/followers')
  async getFollowers(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    return await this.connectionsService.getFollowers(userId, page, limit);
  }

  @Get('/following')
  async getFollowing(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    return await this.connectionsService.getFollowing(userId, page, limit);
  }

  @Post('/:userId/endorse-skill')
  @HttpCode(HttpStatus.CREATED)
  async endorseSkill(
    @Param('userId') endorseeId: string,
    @Body() addEndorsementDto: AddEndoresementDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    validateId(endorseeId, 'user');
    const userId = request.user['sub'];
    return await this.connectionsService.endorseSkill(
      userId,
      endorseeId,
      addEndorsementDto,
    );
  }
}
