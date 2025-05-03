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
  ValidationPipe,
  UsePipes,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('notifications/:companyId')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(
    @Req() req: Request,
    @Param('companyId') companyId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub'];
    return await this.notificationsService.getNotifications(
      userId,
      companyId,
      Number(page),
      Number(limit),
    );
  }

  @Get('unread')
  @HttpCode(HttpStatus.OK)
  async getUnreadMessages(
    @Req() req: Request,
    @Param('companyId') companyId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub'];
    return await this.notificationsService.getUnreadNotifications(
      userId,
      companyId,
      Number(page),
      Number(limit),
    );
  }
  @Get('unseen')
  @HttpCode(HttpStatus.OK)
  async getUnseenCount(
    @Req() req: Request,
    @Param('companyId') companyId: string,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub'];
    return await this.notificationsService.getUnseenCount(userId, companyId);
  }
  @Get('unseen-messages')
  @HttpCode(HttpStatus.OK)
  async getUnseenMessagesCount(
    @Req() req: Request,
    @Param('companyId') companyId: string,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub'];
    return await this.notificationsService.getUnseenMessagesCount(
      userId,
      companyId,
    );
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @Req() req: Request,
    @Param('companyId') companyId: string,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub'];
    return await this.notificationsService.markAsRead(
      notificationId,
      userId,
      companyId,
    );
  }

  @Post('subscribe-fcm')
  @HttpCode(HttpStatus.OK)
  async subscribeFcmToken(
    @Req() req: Request,
    @Body('fcmToken') fcmToken: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    await this.notificationsService.subscribeFcmToken(userId, fcmToken);
    return { message: 'FCM token subscribed successfully' };
  }
}
