import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';
import { handleError } from '../common/utils/exception-handler';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  async getConversations(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    try {
      const conversations = await this.messagesService.getConversations(
        req.user.sub,
        page,
        limit,
      );
      return conversations;
    } catch (error) {
      throw handleError(error, 'Failed to fetch conversations');
    }
  }

  @Get('conversations/:conversationId')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  async getConversationMessages(
    @Req() req,
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    try {
      const messages = await this.messagesService.getConversationMessages(
        conversationId,
        page,
        limit,
      );
      return messages;
    } catch (error) {
      throw handleError(error, 'Failed to fetch conversation messages');
    }
  }

  @Patch('conversations/:conversationId/mark-as-read')
  @UseGuards(JwtAuthGuard)
  async markConversationAsRead(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    try {
      return this.messagesService.setConversationAsRead(
        req.user.sub,
        new Types.ObjectId(conversationId),
      );
    } catch (error) {
      throw handleError(error, 'Failed to mark conversation as read');
    }
  }

  @Patch('conversations/:conversationId/mark-as-unread')
  @UseGuards(JwtAuthGuard)
  async markConversationAsUnread(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    try {
      return this.messagesService.setConversationAsUnread(
        req.user.sub,
        new Types.ObjectId(conversationId),
      );
    } catch (error) {
      throw handleError(error, 'Failed to mark conversation as unread');
    }
  }
}
