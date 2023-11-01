import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtUserData } from 'src/login.guard';

export const RequireLogin = () => SetMetadata('require-login', true);
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

export const UserInfo = createParamDecorator(
  (key: keyof JwtUserData, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request?.user) return null;
    console.log('...............', request.user);

    return key ? request.user[key] : request.user;
  },
);
