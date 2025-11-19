import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UserService } from "../services/user.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { IPaginatedResponse, IPaginationParams } from "@sottosviluppo/core";
import { UserEntity } from "../entities/user.entity";
import {
  CreateUserResponse,
  CreateUserWithInvitationResponse,
} from "../interfaces/user-invitation.interface";

/**
 * Controller handling user management endpoints
 * All routes require authentication and specific permissions
 *
 * @export
 * @class UserController
 */
@ApiTags("Users")
@Controller({
  path: "users",
  version: "1",
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a new user (admin only)
   * If password is not provided, generates and returns invitation token
   *
   * @param {CreateUserDto} createUserDto - User creation data
   * @returns {Promise<CreateUserResponse | CreateUserWithInvitationResponse>}
   * @memberof UserController
   */
  @Post()
  @RequirePermissions("users:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new user",
    description:
      "Creates a new user. If password is not provided, generates invitation token for user to set password.",
  })
  @ApiResponse({
    status: 201,
    description:
      "User successfully created (with invitation token if no password provided)",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid data or missing invitationUrl",
  })
  @ApiResponse({ status: 409, description: "Email or username already exists" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(
    @Body() createUserDto: CreateUserDto
  ): Promise<CreateUserResponse | CreateUserWithInvitationResponse> {
    const result = await this.userService.create(createUserDto);

    // Check if invitation was generated
    if ("invitationToken" in result) {
      return {
        user: result.user.toSafeObject(),
        invitationToken: result.invitationToken,
        invitationUrl: result.invitationUrl,
        message:
          "User created successfully. Invitation token generated (send to user via email).",
      };
    }

    // User created with password
    return {
      user: result.toSafeObject(),
      message: "User created successfully",
    };
  }

  /**
   * Retrieves paginated list of users with filtering and sorting
   *
   * @param {IPaginationParams} pagination - Pagination, sorting and filtering parameters
   * @returns {Promise<IPaginatedResponse<UserEntity>>} Paginated user list
   * @memberof UserController
   */
  @Get()
  @RequirePermissions("users:list")
  @ApiOperation({ summary: "List all users with pagination" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: String,
    description: "Field to sort by (e.g., createdAt, email)",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    enum: ["ASC", "DESC"],
    description: "Sort order (default: ASC)",
  })
  @ApiResponse({ status: 200, description: "User list retrieved successfully" })
  async findAll(
    @Query() pagination: IPaginationParams
  ): Promise<IPaginatedResponse<UserEntity>> {
    return this.userService.findAll(pagination);
  }

  /**
   * Retrieves a single user by ID
   *
   * @param {string} id - User UUID
   * @returns {Promise<UserEntity>} User details
   * @memberof UserController
   */
  @Get(":id")
  @RequirePermissions("users:read")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User details" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<UserEntity> {
    return this.userService.findOne(id);
  }

  /**
   * Updates user information
   *
   * @param {string} id - User UUID
   * @param {UpdateUserDto} updateUserDto - Fields to update
   * @returns {Promise<UserEntity>} Updated user
   * @memberof UserController
   */
  @Patch(":id")
  @RequirePermissions("users:update")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User successfully updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Username already in use" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserEntity> {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Permanently deletes a user
   *
   * @param {string} id - User UUID
   * @returns {Promise<void>}
   * @memberof UserController
   */
  @Delete(":id")
  @RequirePermissions("users:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 204, description: "User successfully deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.remove(id);
  }

  /**
   * Resends invitation to user who hasn't set password yet
   *
   * @param {string} id - User UUID
   * @param {object} body - Invitation URL
   * @returns {Promise<object>}
   * @memberof UserController
   */
  @Post(":id/resend-invitation")
  @RequirePermissions("users:update")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resend invitation to user",
    description:
      "Generates new invitation token for user who hasn't set password",
  })
  @ApiResponse({
    status: 200,
    description: "Invitation token generated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "User already has password set",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async resendInvitation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("invitationUrl") invitationUrl: string
  ): Promise<{
    invitationToken: string;
    invitationUrl: string;
    message: string;
  }> {
    const user = await this.userService.findOne(id);

    // Check if user already has password
    const userWithPassword = await this.userService.findByEmail(user.email);
    if (userWithPassword?.password) {
      throw new BadRequestException(
        "User already has password set. Use password reset instead."
      );
    }

    const result = await this.userService.resendInvitation(id, invitationUrl);

    return {
      invitationToken: result.token,
      invitationUrl: result.invitationUrl,
      message: "Invitation token generated successfully",
    };
  }
}
