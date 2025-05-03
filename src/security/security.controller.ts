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

@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly connectionService: ConnectionsService,
  ) {}

  @Post('report')
  @UsePipes(new ValidationPipe())
  async reportContent(@Req() req, @Body() reportRequest: ReportRequestDto) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.securityService.createReport(req.user.sub, reportRequest);
  }

  @Post('report/job/:jobId')
  async reportJob(@Req() req, @Param('jobId') jobId: string) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.securityService.reportJob(new Types.ObjectId(jobId));
  }

  @Get('blocked-users')
  async getBlockedUsers(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return await this.connectionService.getBlocked(
      req.user.sub,
      Number(page),
      Number(limit),
    );
  }

  @Post('block/:userId')
  async blockUser(@Req() req, @Param('userId') userId: string) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.connectionService.block(req.user.sub.toString(), userId);
  }

  @Post('unblock/:userId')
  async unblockUser(@Req() req, @Param('userId') userId: string) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.connectionService.unblock(req.user.sub.toString(), userId);
  }
}
