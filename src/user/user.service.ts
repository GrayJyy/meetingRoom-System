import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger();

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @Inject(RedisService)
  private readonly redisService: RedisService;

  async register(registerUserDto: RegisterUserDto) {
    const _foundedCaptcha = await this.redisService.get(
      registerUserDto.captcha,
    );
    if (!_foundedCaptcha) throw new UnauthorizedException('验证码错误');
    const _foundedUser = await this.userRepository.findBy({
      username: registerUserDto.username,
    });
    if (!_foundedUser) throw new BadRequestException('用户已存在');
    console.log(registerUserDto);
  }
}
