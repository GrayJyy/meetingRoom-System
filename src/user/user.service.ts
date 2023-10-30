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
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  @Inject(EmailService)
  private readonly emailService: EmailService;
  @Inject(RedisService)
  private readonly redisService: RedisService;
  private readonly logger = new Logger();

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Role)
  private readonly roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private readonly permissionRepository: Repository<Permission>;

  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = '111111';
    user1.email = 'xxx@xx.com';
    user1.is_admin = true;
    user1.nick_name = '张三';
    user1.phone_number = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = '222222';
    user2.email = 'yy@yy.com';
    user2.nick_name = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
    return 'done';
  }

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

  async login(loginUserDto: LoginUserDto) {
    console.log(loginUserDto);
  }
}
