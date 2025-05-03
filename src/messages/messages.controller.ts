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
    const conversations = await this.messagesService.getConversations(
      req.user.sub,
      page,
      limit,
    );
    return conversations;
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
    const messages = await this.messagesService.getConversationMessages(
      conversationId,
      page,
      limit,
    );
    return messages;
  }

  @Patch('conversations/:conversationId/mark-as-read')
  @UseGuards(JwtAuthGuard)
  async markConversationAsRead(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.setConversationAsRead(
      req.user.sub,
      new Types.ObjectId(conversationId),
    );
  }

  @Patch('conversations/:conversationId/mark-as-unread')
  @UseGuards(JwtAuthGuard)
  async markConversationAsUnread(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.setConversationAsUnread(
      req.user.sub,
      new Types.ObjectId(conversationId),
    );
  }
}
