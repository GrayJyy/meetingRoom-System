import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

@Controller('user')
export class UserController {
  @Inject(EmailService)
  private readonly emailService: EmailService;
  @Inject(RedisService)
  private readonly redisService: RedisService;

  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    await this.userService.register(registerUserDto);
    return 'success';
  }

  @Get('captcha')
  async captcha(@Query('address') to: RegisterUserDto['email']) {
    const _captcha = Math.random().toString().slice(2, 8);
    await this.redisService.set(`captcha_${to}`, _captcha, 5 * 60);
    await this.emailService.sendMail({
      to,
      subject: '注册验证码',
      html: `<p>你的注册验证码是: ${_captcha}</p>`,
    });
    return 'success';
  }
}
