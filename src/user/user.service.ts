import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { md5 } from 'src/utils/utils';
import { LoginUserVo } from './vo/login-user.vo';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { JwtUserData } from 'src/login.guard';
import { MailType } from 'src/constant';
import { UnLoginException } from 'src/unlogin.filter';

@Injectable()
export class UserService {
  @Inject(EmailService)
  private readonly emailService: EmailService;
  @Inject(RedisService)
  private readonly redisService: RedisService;
  private readonly logger = new Logger();
  @Inject(JwtService)
  private readonly jwtService: JwtService;
  @Inject(ConfigService)
  private readonly configService: ConfigService;

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

  async captcha(to: RegisterUserDto['email'], type: MailType) {
    const _foundedUser = await this.userRepository.findOneBy({
      email: to,
    });
    if (_foundedUser && type === MailType.注册)
      throw new BadRequestException('用户已存在');
    if (!_foundedUser && type === MailType.修改密码)
      throw new BadRequestException('用户不存在');
    const _captcha = Math.random().toString().slice(2, 8);
    if (type === MailType.注册) {
      await this.redisService.set(`captcha_${to}`, _captcha, 5 * 60);
    } else if (type === MailType.修改密码) {
      await this.redisService.set(
        `update_password_captcha_${to}`,
        _captcha,
        5 * 60,
      );
    }

    try {
      await this.emailService.sendMail({
        to,
        subject: '验证码',
        html: `<p>你的验证码是: ${_captcha}</p>`,
      });
      return '发送成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '发送失败';
    }
  }

  async login({ username, password }: LoginUserDto, isAdmin: boolean = false) {
    const _foundedUser = await this.userRepository.findOne({
      where: { username, is_admin: isAdmin },
      relations: ['roles', 'roles.permissions'],
    });
    if (!_foundedUser) throw new UnLoginException();
    // throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);

    if (_foundedUser.password !== md5(password))
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);

    return this.generateUserVo(_foundedUser);
  }

  jwtSign(vo: LoginUserVo) {
    const { userInfo } = vo;
    vo.accessToken = this.jwtService.sign(
      {
        userId: userInfo.id,
        username: userInfo.username,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('application.jwt.access_expires') || '30m',
      },
    );

    vo.refreshToken = this.jwtService.sign(
      {
        userId: userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('application.jwt.refresh_expires') || '7d',
      },
    );
    return vo;
  }

  async findById(id: number, isAdmin: boolean = false) {
    const _foundedUser = await this.userRepository.findOne({
      where: { id, is_admin: isAdmin },
      relations: ['roles', 'roles.permissions'],
    });

    return this.generateUserVo(_foundedUser);
  }

  generateUserVo(foundedUser: User) {
    const {
      id,
      nick_name,
      username,
      email,
      phone_number,
      head_pic,
      create_time,
      is_admin,
      is_frozen,
      roles,
    } = foundedUser;
    const _roles = roles.map((i) => i.name);
    const _permissions = roles.reduce((prev, { permissions }) => {
      permissions.forEach(
        (permission) =>
          prev.every((i) => i?.code !== permission.code) &&
          prev.push(permission),
      );
      return prev;
    }, []);

    const _vo = new LoginUserVo();
    _vo.userInfo = {
      id,
      username,
      nickName: nick_name,
      email,
      phoneNumber: phone_number,
      headPic: head_pic,
      isAdmin: is_admin,
      isFrozen: is_frozen,
      roles: _roles,
      permissions: _permissions,
      createTime: create_time,
    };
    return _vo;
  }

  async findUserDetailById(userId: JwtUserData['userId']) {
    const _foundedUser = await this.userRepository.findOneBy({
      id: userId,
    });
    return _foundedUser;
  }

  async updatePassword(
    userId: JwtUserData['userId'],
    { email, password, captcha }: UpdateUserPasswordDto,
  ) {
    const _captcha = await this.redisService.get(
      `update_password_captcha_${email}`,
    );
    if (!_captcha)
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    if (captcha !== _captcha)
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    // const _foundedUser = await this.findUserDetailById(userId);
    // _foundedUser.password = password;
    try {
      await this.userRepository.update(userId, { password: md5(password) }); // 并没有进入BeforeInsert
      // await this.userRepository.save(_foundedUser);
      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '密码修改失败';
    }
  }
}
