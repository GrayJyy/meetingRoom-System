import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, UserInfo } from 'src/utils/custom.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Get('init-data')
  async initData() {
    return await this.userService.initData();
  }

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.register(registerUserDto);
  }

  @Get('captcha')
  async captcha(@Query('address') to: RegisterUserDto['email']) {
    return await this.userService.captcha(to);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const _vo = await this.userService.login(loginUserDto);
    return this.userService.jwtSign(_vo);
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUserDto: LoginUserDto) {
    const _vo = await this.userService.login(loginUserDto, true);
    return this.userService.jwtSign(_vo);
  }

  @Get('refresh')
  async refresh(@Query('token') token: string) {
    try {
      const { id } = this.jwtService.verify<{ id: number }>(token);
      const _foundedUser = await this.userService.findById(id);
      const { accessToken, refreshToken } =
        this.userService.jwtSign(_foundedUser);
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('admin/fresh')
  async adminRefresh(@Query('token') token: string) {
    try {
      const { id } = this.jwtService.verify<{ id: number }>(token);
      const _foundedUser = await this.userService.findById(id, true);
      const { accessToken, refreshToken } =
        this.userService.jwtSign(_foundedUser);
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    console.log(userId);

    return await this.userService.findUserDetailById(userId);
  }
}
