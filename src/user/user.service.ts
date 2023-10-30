import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';
// import { md5 } from 'src/utils/utils';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UserService {
  @Inject(EmailService)
  private readonly emailService: EmailService;
  @Inject(RedisService)
  private readonly redisService: RedisService;
  private readonly logger = new Logger();

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async register({
    email,
    username,
    captcha,
    nickName,
    password,
  }: RegisterUserDto) {
    const _foundedCaptcha = await this.redisService.get(`captcha_${email}`);
    if (!_foundedCaptcha) throw new BadRequestException('验证码已失效');
    if (captcha !== _foundedCaptcha)
      throw new BadRequestException('验证码不正确');
    const _foundedUser = await this.userRepository.findOneBy({
      username: username,
    });
    if (_foundedUser) throw new BadRequestException('用户已存在');
    const _newUser = new User();
    _newUser.username = username;
    _newUser.password = password;
    _newUser.email = email;
    _newUser['nick_name'] = nickName;
    try {
      await this.userRepository.save(_newUser);
      return '注册成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '注册失败';
    }
  }

  async captcha(to: RegisterUserDto['email']) {
    const _foundedUser = await this.userRepository.findOneBy({
      email: to,
    });
    if (_foundedUser) throw new BadRequestException('用户已存在');
    const _captcha = Math.random().toString().slice(2, 8);
    await this.redisService.set(`captcha_${to}`, _captcha, 5 * 60);
    try {
      await this.emailService.sendMail({
        to,
        subject: '注册验证码',
        html: `<p>你的注册验证码是: ${_captcha}</p>`,
      });
      return '发送成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '发送失败';
    }
  }
}
