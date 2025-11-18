import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";
import {
  IPermission,
  PermissionAction,
  PermissionResource,
} from "@filcronet/core";
import { RoleEntity } from "./role.entity";

/**
 * Permission entity representing granular access control
 * Permissions define what actions can be performed on which resources
 * Format: resource:action (e.g., 'users:create', 'products:delete')
 *
 * @class PermissionEntity
 * @implements {IPermission}
 */
@Entity("permissions")
export class PermissionEntity implements IPermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Resource type this permission applies to
   * Examples: 'users', 'products', 'orders'
   */
  @Column({
    type: "enum",
    enum: PermissionResource,
  })
  resource: PermissionResource;

  /**
   * Action that can be performed on the resource
   * Examples: 'create', 'read', 'update', 'delete', 'list', 'manage'
   */
  @Column({
    type: "enum",
    enum: PermissionAction,
  })
  action: PermissionAction;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
