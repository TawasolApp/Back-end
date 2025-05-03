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
  /**
   * Retrieves paginated conversations for the authenticated user
   * @param req - Request object containing user information
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of conversations per page (default: 10)
   * @returns {Promise<Object>} Paginated list of conversations with:
   *   - data: Array of conversation objects
   *   - pagination: Pagination metadata
   * @throws {UnauthorizedException} If user is not authenticated
   */
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
  /**
   * Retrieves paginated messages for a specific conversation
   * @param req - Request object containing user information
   * @param conversationId - ID of the conversation to retrieve messages from
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of messages per page (default: 20)
   * @returns {Promise<Object>} Paginated list of messages with:
   *   - data: Array of message objects
   *   - pagination: Pagination metadata
   * @throws {UnauthorizedException} If user is not authenticated
   */
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
  /**
   * Marks all messages in a conversation as read
   * @param req - Request object containing user information
   * @param conversationId - ID of the conversation to mark as read
   * @returns {Promise<Object>} Updated conversation details including:
   *   - lastMessage: The most recent message
   *   - unseenCount: Number of unseen messages
   *   - markedAsUnread: Boolean indicating if conversation is marked unread
   *   - otherParticipant: Information about the other conversation participant
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {NotFoundException} If conversation is not found
   */
  @Patch('conversations/:conversationId/mark-as-read')
  @UseGuards(JwtAuthGuard)
  async markConversationAsRead(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.messagesService.setConversationAsRead(
      req.user.sub,
      new Types.ObjectId(conversationId),
    );
  }

  /**
   * Marks a conversation as unread for the authenticated user
   * @param req - Request object containing user information
   * @param conversationId - ID of the conversation to mark as unread
   * @returns {Promise<Object>} Updated conversation details including:
   *   - lastMessage: The most recent message
   *   - unseenCount: Number of unseen messages
   *   - markedAsUnread: Boolean indicating if conversation is marked unread
   *   - otherParticipant: Information about the other conversation participant
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {NotFoundException} If conversation is not found
   */
  @Patch('conversations/:conversationId/mark-as-unread')
  @UseGuards(JwtAuthGuard)
  async markConversationAsUnread(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.messagesService.setConversationAsUnread(
      req.user.sub,
      new Types.ObjectId(conversationId),
    );
  }
}
