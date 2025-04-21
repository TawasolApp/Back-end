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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { UpdateReactionsDto } from './dto/update-reactions.dto';
import { ReactionDto } from './dto/get-reactions.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditCommentDto } from './dto/edit-comment.dto';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('posts/:companyId')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addPost(
    @Param('companyId') companyId: string,
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userId = req.user['sub'];
    return await this.postsService.addPost(createPostDto, userId, companyId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPosts(
    @Param('companyId') companyId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getAllPosts(
      page,
      limit,
      req.user['sub'],
      companyId,
    );
  }

  @Post('react/:postId')
  @HttpCode(HttpStatus.OK)
  async updateReactions(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Body() updateReactionsDto: UpdateReactionsDto,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    const userIdFromToken = req.user['sub'];
    return await this.postsService.updateReactions(
      postId,
      userIdFromToken,
      updateReactionsDto,
      companyId,
    );
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchPosts(
    @Param('companyId') companyId: string,
    @Req() req: Request,
    @Query('q') query: string,
    @Query('network') network?: string,
    @Query('timeframe') timeframe?: '24h' | 'week' | 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<GetPostDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');

    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query (q) is required');
    }

    return await this.postsService.searchPosts(
      req.user['sub'],
      query,
      network === 'true',
      timeframe ?? 'all',
      page,
      limit,
      companyId,
    );
  }

  @Get('reactions/:postId')
  @HttpCode(HttpStatus.OK)
  async getReactions(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Query('reactionType') reactionType: string = 'All',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<ReactionDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getReactions(
      postId,
      page,
      limit,
      reactionType,
      req.user['sub'],
      companyId,
    );
  }

  @Get('comments/:postId')
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetCommentDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getComments(
      postId,
      page,
      limit,
      req.user['sub'],
      companyId,
    );
  }

  @Post('save/:postId')
  @HttpCode(HttpStatus.OK)
  async savePost(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.savePost(postId, req.user['sub'], companyId);
  }

  @Get('saved')
  @HttpCode(HttpStatus.OK)
  async getSavedPosts(
    @Param('companyId') companyId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getSavedPosts(
      req.user['sub'],
      page,
      limit,
      companyId,
    );
  }

  @Post('comment/:postId')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.addComment(
      postId,
      createCommentDto,
      req.user['sub'],
      companyId,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPost(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getPost(id, req.user['sub'], companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    await this.postsService.deletePost(id, req.user['sub'], companyId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async editPost(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() editPostDto: EditPostDto,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.editPost(
      id,
      editPostDto,
      req.user['sub'],
      companyId,
    );
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserPosts(
    @Param('companyId') companyId: string,
    @Param('userId') searchedUserId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getUserPosts(
      searchedUserId,
      req.user['sub'],
      page,
      limit,
      companyId,
    );
  }

  @Delete('save/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsavePost(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    await this.postsService.unsavePost(postId, req.user['sub'], companyId);
  }

  @Patch('comment/:commentId')
  @HttpCode(HttpStatus.OK)
  async editComment(
    @Param('companyId') companyId: string,
    @Param('commentId') commentId: string,
    @Body() editCommentDto: EditCommentDto,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.editComment(
      commentId,
      editCommentDto,
      req.user['sub'],
      companyId,
    );
  }

  @Delete('comment/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('companyId') companyId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    await this.postsService.deleteComment(
      commentId,
      req.user['sub'],
      companyId,
    );
  }

  @Get(':postId/reposts')
  @HttpCode(HttpStatus.OK)
  async getReposts(
    @Param('companyId') companyId: string,
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getRepostsOfPost(
      postId,
      req.user['sub'],
      page,
      limit,
      companyId,
    );
  }

  @Get('reposts/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserReposts(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) throw new UnauthorizedException('User not authenticated');
    return await this.postsService.getRepostsByUser(
      userId,
      page,
      limit,
      req.user['sub'],
      companyId,
    );
  }
}
