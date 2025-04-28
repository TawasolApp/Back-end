import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const messages = await this.messagesService.getConversationMessages(
      conversationId,
      page,
      limit,
    );
    return messages;
  }
}
