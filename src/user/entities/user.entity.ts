import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { md5 } from 'src/utils/md5';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 50, comment: '用户名' })
  username: string;
  @Column({ length: 50 })
  password: string;
  @Column({ length: 50 })
  nick_name: string;
  @Column({ length: 50 })
  email: string;
  @Column({ length: 100, default: '' })
  head_pic: string;
  @Column({ length: 20, default: '' })
  phone_number: string;
  @Column({ default: false })
  is_frozen: boolean;
  @Column({ default: false })
  is_admin: boolean;
  @CreateDateColumn()
  create_time: Date;
  @UpdateDateColumn()
  update_time: Date;

  @BeforeInsert()
  encryptPwd() {
    this.password = md5(this.password);
  }
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_role',
  })
  roles: Role[];
}
