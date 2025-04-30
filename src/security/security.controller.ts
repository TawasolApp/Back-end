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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SecurityService } from './security.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { BlockedUserDto } from './dto/blocked-user.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('report')
  @UsePipes(new ValidationPipe())
  async reportContent(@Req() req, @Body() reportRequest: ReportRequestDto) {
    return this.securityService.createReport(req.user.sub, reportRequest);
  }

  @Post('report/job/:jobId')
  async reportJob(@Req() req, @Param('jobId') jobId: string) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.securityService.reportJob(new Types.ObjectId(jobId));
  }

  //   @Get('blocked-users')
  //   async getBlockedUsers(
  //     @Req() req,
  //   ): Promise<{ blockedUsers: BlockedUserDto[] }> {
  //     const blockedUsers = await this.securityService.getBlockedUsers(
  //       req.user.sub,
  //     );
  //     return { blockedUsers };
  //   }

  //   @Post('block/:userId')
  //   async blockUser(@Req() req, @Param('userId') userId: string) {
  //     return this.securityService.blockUser(req.user.sub, userId);
  //   }

  //   @Post('unblock/:userId')
  //   async unblockUser(@Req() req, @Param('userId') userId: string) {
  //     return this.securityService.unblockUser(req.user.sub, userId);
  //   }
}
