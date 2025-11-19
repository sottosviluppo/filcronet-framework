import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from "typeorm";
import { IPermission, PermissionAction } from "@sottosviluppo/core";
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
@Index(["resource", "action"], { unique: true }) // Unique constraint
export class PermissionEntity implements IPermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Resource type this permission applies to
   * Examples: 'users', 'products', 'orders', 'blog-posts'
   * Defined dynamically by each project
   */
  @Column({ type: "varchar", length: 100 })
  resource: string;

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

  /**
   * Returns permission in string format "resource:action"
   *
   * @returns {string} Permission string
   * @memberof PermissionEntity
   */
  toString(): string {
    return `${this.resource}:${this.action}`;
  }
}
