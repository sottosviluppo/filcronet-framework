import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { IUser, UserStatus } from "@sottosviluppo/core";
import { RoleEntity } from "./role.entity";
import * as bcrypt from "bcrypt";

/**
 * User entity representing application users
 *
 * @class UserEntity
 * @implements {IUser}
 */
@Entity("users")
export class UserEntity implements IUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  username?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ select: false, nullable: true })
  password?: string;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ default: false })
  emailVerified: boolean;

  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles: RoleEntity[];

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ type: "int", default: 0 })
  passwordVersion: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Automatically hashes the password before insert or update
   * Only hashes if password is not already hashed (doesn't start with $2)
   *
   * @private
   * @memberof UserEntity
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith("$2")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * Validates a plain text password against the stored hash
   *
   * @param {string} password - Plain text password to validate
   * @returns {Promise<boolean>} True if password matches, false otherwise
   * @memberof UserEntity
   */
  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) {
      return false;
    }
    return bcrypt.compare(password, this.password);
  }

  /**
   * Converts user entity to safe object without sensitive fields
   *
   * @returns {Omit<UserEntity, 'password'>} User object without password
   * @memberof UserEntity
   */
  toSafeObject(): Omit<UserEntity, "password"> {
    const { password, ...safe } = this;
    return safe as Omit<UserEntity, "password">;
  }

  /**
   * Custom JSON serialization to exclude password field
   *
   * @returns {Omit<UserEntity, 'password'>} User object without password
   * @memberof UserEntity
   */
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
