import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';

import { SecurityService } from './security.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConnectionsService } from '../connections/connections.service';
import { handleError } from '../common/utils/exception-handler';

@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly connectionService: ConnectionsService,
  ) {}

  /**
   * Reports inappropriate content or user behavior
   * @param req - The request object containing user information
   * @param reportRequest - DTO containing report details:
   *   - reportedId: ID of the reported entity
   *   - reportedType: Type of entity being reported (User, Post, etc.)
   *   - reason: Description of the issue
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {InternalServerErrorException} If report creation fails
   */
  @Post('report')
  @UsePipes(new ValidationPipe())
  async reportContent(@Req() req, @Body() reportRequest: ReportRequestDto) {
    return this.securityService.createReport(req.user.sub, reportRequest);
  }
  /**
   * Reports a job as inappropriate
   * @param req - The request object containing user information
   * @param jobId - ID of the job to report
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {InternalServerErrorException} If job reporting fails
   */
  @Post('report/job/:jobId')
  async reportJob(@Req() req, @Param('jobId') jobId: string) {
    return this.securityService.reportJob(new Types.ObjectId(jobId));
  }
  /**
   * Retrieves a paginated list of users blocked by the current user
   * @param req - The request object containing user information
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 20)
   * @returns {Promise<Object>} Paginated list of blocked users
   * @throws {UnauthorizedException} If user is not authenticated
   */
  @Get('blocked-users')
  async getBlockedUsers(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.connectionService.getBlocked(
      req.user.sub,
      Number(page),
      Number(limit),
    );
  }

  /**
   * Blocks a user, preventing future interactions
   * @param req - The request object containing user information
   * @param userId - ID of the user to block
   * @returns {Promise<Object>} Result of the block operation
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {NotFoundException} If user to block doesn't exist
   */
  @Post('block/:userId')
  async blockUser(@Req() req, @Param('userId') userId: string) {
    return this.connectionService.block(req.user.sub.toString(), userId);
  }
  /**
   * Unblocks a previously blocked user
   * @param req - The request object containing user information
   * @param userId - ID of the user to unblock
   * @returns {Promise<Object>} Result of the unblock operation
   * @throws {UnauthorizedException} If user is not authenticated
   * @throws {NotFoundException} If user to unblock doesn't exist
   */
  @Post('unblock/:userId')
  async unblockUser(@Req() req, @Param('userId') userId: string) {
    return this.connectionService.unblock(req.user.sub.toString(), userId);
  }
}
