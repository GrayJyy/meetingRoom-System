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
import { md5 } from 'src/utils/utils';

@Injectable()
export class UserService {
  private readonly logger = new Logger();

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @Inject(RedisService)
  private readonly redisService: RedisService;

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
    _newUser.password = md5(password);
    _newUser.email = email;
    _newUser['nick_name'] = nickName;
  }
}
