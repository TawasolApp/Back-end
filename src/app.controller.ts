import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('test')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('get')
  @HttpCode(HttpStatus.OK)
  getTest(): Promise<string> {
    return this.appService.getTest();
  }

  @Post('post')
  @HttpCode(HttpStatus.CREATED)
  postTest(@Query('message') testMessage: string) {
    return this.appService.postTest(testMessage);
  }
}
