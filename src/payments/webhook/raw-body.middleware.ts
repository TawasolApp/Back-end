import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    if (request.originalUrl.startsWith('/api/webhook/stripe')) {
      bodyParser.raw({ type: 'application/json' })(request, response, next);
    } else {
      bodyParser.json()(request, response, next);
    }
  }
}
