import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { UserEntity } from "../entities/user.entity";
import { RoleEntity } from "../entities/role.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import {
  IPaginationParams,
  IPaginatedResponse,
  UserStatus,
} from "@sottosviluppo/core";
import { PasswordRecoveryService } from "./password-recovery.service";
import { UserCreatedWithInvitation } from "../interfaces/user-invitation.interface";

/**
 * Internal type for user creation with additional fields
 * Allows services to pass extra data not exposed in public DTO
 */
type InternalCreateUserDto = CreateUserDto & {
  status?: UserStatus;
};

/**
 * Service for managing user-related operations
 * Handles CRUD operations, validation, and user management
 *
 * @export
 * @class UserService
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @Inject(forwardRef(() => PasswordRecoveryService))
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  /**
   * Creates a new user with validation
   * If password is not provided, generates invitation token
   *
   * @param {InternalCreateUserDto} createUserDto - User creation data
   * @returns {Promise<UserEntity | UserCreatedWithInvitation>} Created user (with invitation if no password)
   * @throws {ConflictException} If email or username already exists
   * @throws {BadRequestException} If invitation required but no URL provided
   * @memberof UserService
   */
  async create(
    createUserDto: InternalCreateUserDto
  ): Promise<UserEntity | UserCreatedWithInvitation> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    // Check if username already exists (if provided)
    if (createUserDto.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });

      if (existingUsername) {
        throw new ConflictException("Username already in use");
      }
    }

    // Load roles if specified
    let roles: RoleEntity[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.findBy({
        id: In(createUserDto.roleIds),
      });
    } else {
      // Assign default "user" role
      const defaultRole = await this.roleRepository.findOne({
        where: { name: "user" },
      });
      if (defaultRole) {
        roles = [defaultRole];
      }
    }

    // Determine status based on whether password is provided
    let status = createUserDto.status;
    if (!status) {
      status = createUserDto.password
        ? UserStatus.PENDING_VERIFICATION
        : UserStatus.INACTIVE;
    }

    // Create user (password can be undefined)
    const user = this.userRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      password: createUserDto.password,
      roles,
      status,
    });

    const savedUser = await this.userRepository.save(user);

    // If no password provided, generate invitation
    if (!createUserDto.password) {
      if (!createUserDto.invitationUrl) {
        throw new BadRequestException(
          "invitationUrl is required when creating user without password"
        );
      }

      const { token, invitationUrl } =
        await this.passwordRecoveryService.generateInvitation(
          savedUser.id,
          createUserDto.invitationUrl
        );

      return {
        user: savedUser,
        invitationToken: token,
        invitationUrl,
      };
    }

    // User created with password, return normally
    return savedUser;
  }

  /**
   * Counts total users in the system
   *
   * @returns {Promise<number>} Total user count
   * @memberof UserService
   */
  async count(): Promise<number> {
    return this.userRepository.count();
  }

  /**
   * Retrieves paginated list of users with sorting options
   *
   * @param {IPaginationParams} [pagination] - Pagination and sorting parameters
   * @returns {Promise<IPaginatedResponse<UserEntity>>} Paginated user list
   * @memberof UserService
   */
  async findAll(
    pagination?: IPaginationParams
  ): Promise<IPaginatedResponse<UserEntity>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "roles")
      .leftJoinAndSelect("roles.permissions", "permissions");

    // Apply sorting
    if (pagination?.sortBy) {
      const order = pagination.sortOrder || "ASC";
      queryBuilder.orderBy(`user.${pagination.sortBy}`, order);
    } else {
      queryBuilder.orderBy("user.createdAt", "DESC");
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Finds a single user by ID with relations
   *
   * @param {string} id - User UUID
   * @returns {Promise<UserEntity>} User entity with roles and permissions
   * @throws {NotFoundException} If user not found
   * @memberof UserService
   */
  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["roles", "roles.permissions"],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Finds a user by email including password field for authentication
   *
   * @param {string} email - User email address
   * @returns {Promise<UserEntity | null>} User entity or null if not found
   * @memberof UserService
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ["roles", "roles.permissions"],
      select: [
        "id",
        "email",
        "username",
        "firstName",
        "lastName",
        "password",
        "status",
        "emailVerified",
        "lastLoginAt",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  /**
   * Updates user information with validation
   *
   * @param {string} id - User UUID
   * @param {UpdateUserDto} updateUserDto - Fields to update
   * @returns {Promise<UserEntity>} Updated user entity
   * @throws {NotFoundException} If user not found
   * @throws {ConflictException} If username already in use
   * @memberof UserService
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    // Check if username is being changed and is not already in use
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUsername) {
        throw new ConflictException("Username already in use");
      }
    }

    // Update roles if specified
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.findBy({
        id: In(updateUserDto.roleIds),
      });
      user.roles = roles;
    }

    // Update other fields
    Object.assign(user, {
      username: updateUserDto.username,
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      status: updateUserDto.status,
    });

    return this.userRepository.save(user);
  }

  /**
   * Permanently deletes a user
   *
   * @param {string} id - User UUID
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user not found
   * @memberof UserService
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Updates the last login timestamp for a user
   *
   * @param {string} userId - User UUID
   * @returns {Promise<void>}
   * @memberof UserService
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Generates new invitation for user who hasn't set password
   *
   * @param {string} userId - User UUID
   * @param {string} invitationUrlBase - Base URL for invitation
   * @returns {Promise<{ token: string; invitationUrl: string }>}
   * @throws {BadRequestException} If user already has password
   * @memberof UserService
   */
  async resendInvitation(
    userId: string,
    invitationUrlBase: string
  ): Promise<{ token: string; invitationUrl: string }> {
    const user = await this.findOne(userId);

    // Check if user has password
    const userWithPassword = await this.userRepository.findOne({
      where: { id: userId },
      select: ["id", "password"],
    });

    if (userWithPassword?.password) {
      throw new BadRequestException(
        "User already has password. Use password reset instead."
      );
    }

    // Generate new invitation
    return this.passwordRecoveryService.generateInvitation(
      userId,
      invitationUrlBase
    );
  }
}
