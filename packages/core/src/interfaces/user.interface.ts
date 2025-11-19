import { UserStatus } from "../enums/user-status.enum";
import { IRole } from "./role.interface";

/**
 * User entity interface
 * Defines the structure for user objects throughout the application
 *
 * @export
 * @interface IUser
 */
export interface IUser {
  /**
   * Unique user identifier (UUID)
   *
   * @type {string}
   */
  id: string;

  /**
   * User email address (unique)
   * Used for authentication and communication
   *
   * @type {string}
   */
  email: string;

  /**
   * Optional username (unique if provided)
   * Alternative identifier for the user
   *
   * @type {string}
   */
  username?: string;

  /**
   * User's first name
   *
   * @type {string}
   */
  firstName?: string;

  /**
   * User's last name
   *
   * @type {string}
   */
  lastName?: string;

  /**
   * Hashed password
   * Should never be exposed in API responses
   *
   * @type {string}
   */
  password?: string;

  /**
   * Current user account status
   *
   * @type {UserStatus}
   */
  status: UserStatus;

  /**
   * Whether user's email has been verified
   *
   * @type {boolean}
   */
  emailVerified: boolean;

  /**
   * Roles assigned to this user
   *
   * @type {IRole[]}
   */
  roles: IRole[];

  /**
   * Timestamp of user creation
   *
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp of last update
   *
   * @type {Date}
   */
  updatedAt: Date;

  /**
   * Timestamp of last successful login
   *
   * @type {Date}
   */
  lastLoginAt?: Date;
}

/**
 * Data Transfer Object for creating a new user
 *
 * @export
 * @interface ICreateUserDto
 */
export interface ICreateUserDto {
  /**
   * User email address (must be unique)
   *
   * @type {string}
   */
  email: string;

  /**
   * Optional username (must be unique if provided)
   *
   * @type {string}
   */
  username?: string;

  /**
   * User's first name
   *
   * @type {string}
   */
  firstName?: string;

  /**
   * User's last name
   *
   * @type {string}
   */
  lastName?: string;

  /**
   * Plain text password (will be hashed)
   *
   * @type {string}
   */
  password?: string;

  /**
   * Array of role IDs to assign to the user
   * If not provided, default role will be assigned
   *
   * @type {string[]}
   */
  roleIds?: string[];
}

/**
 * Data Transfer Object for updating user information
 * All fields are optional
 *
 * @export
 * @interface IUpdateUserDto
 */
export interface IUpdateUserDto {
  /**
   * Updated username
   *
   * @type {string}
   */
  username?: string;

  /**
   * Updated first name
   *
   * @type {string}
   */
  firstName?: string;

  /**
   * Updated last name
   *
   * @type {string}
   */
  lastName?: string;

  /**
   * Updated user status
   *
   * @type {UserStatus}
   */
  status?: UserStatus;

  /**
   * Updated array of role IDs
   *
   * @type {string[]}
   */
  roleIds?: string[];
}
