import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private readonly reflector: Reflector;
  @Inject(JwtService)
  private readonly jwtService: JwtService;
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requirePermission = this.reflector.getAllAndOverride<string[]>(
      'require-permission',
      [context.getClass(), context.getHandler()],
    );
    if (!requirePermission) return true;
    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;
    if (!authorization) throw new UnauthorizedException('用户未登录');
    const permissions = request.user.permissions;
    if (
      !requirePermission.every((cur) => permissions.some((i) => i.code === cur))
    ) {
      throw new UnauthorizedException('您没有访问该接口的权限');
    }
    return true;
  }
}
