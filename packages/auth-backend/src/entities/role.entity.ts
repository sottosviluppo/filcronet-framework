import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { IRole } from "@filcronet/core";
import { UserEntity } from "./user.entity";
import { PermissionEntity } from "./permission.entity";

/**
 * Role entity representing user roles in the system
 * Roles group permissions and are assigned to users
 *
 * @class RoleEntity
 * @implements {IRole}
 */
@Entity("roles")
export class RoleEntity implements IRole {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  /**
   * System roles cannot be modified or deleted
   * Examples: 'admin', 'user'
   */
  @Column({ default: false })
  isSystem: boolean;

  @ManyToMany(() => PermissionEntity, { eager: true })
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions: PermissionEntity[];

  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
