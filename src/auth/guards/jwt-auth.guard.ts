import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    const token = authHeader.split(' ')[1]; // Extract token after "Bearer"
    try {
      request.user = this.jwtService.verify(token); // Decode and verify token
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
