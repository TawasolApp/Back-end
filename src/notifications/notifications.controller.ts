import {
  Controller,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
  Param,
  Body,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub']; // Extract user ID from JWT payload
    return await this.notificationsService.getNotifications(userId);
  }

  @Get('unseen')
  @HttpCode(HttpStatus.OK)
  async getUnseenCount(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub']; // Extract user ID from JWT payload
    return await this.notificationsService.getUnseenCount(userId);
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub']; // Extract user ID from JWT payload
    return await this.notificationsService.markAsRead(notificationId, userId);
  }
}
