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
      const decoded = this.jwtService.verify(token);
      request.user = decoded; // Decode and verify token
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
