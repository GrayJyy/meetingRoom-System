import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

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
  @Column({ length: 100 })
  head_pic: string;
  @Column({ length: 20 })
  phone_number: string;
  @Column()
  is_frozen: boolean;
  @Column()
  is_admin: boolean;
  @CreateDateColumn()
  create_time: Date;
  @UpdateDateColumn()
  update_time: Date;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_role',
  })
  roles: Role[];
}
