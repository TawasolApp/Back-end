import {
  Controller,
  Get,
  Req,
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
  async getConversations(@Req() req) {
    const conversations = await this.messagesService.getConversations(
      req.user.sub,
    );
    return conversations;
  }
}
