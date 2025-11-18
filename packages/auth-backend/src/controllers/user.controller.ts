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
import { IPaginatedResponse, IPaginationParams } from "@filcronet/core";
import { UserEntity } from "../entities/user.entity";

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
   *
   * @param {CreateUserDto} createUserDto - User creation data
   * @returns {Promise<UserEntity>} Created user
   * @memberof UserController
   */
  @Post()
  @RequirePermissions("users:create")
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 409, description: "Email or username already exists" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userService.create(createUserDto);
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
  async findAll(@Query() pagination: IPaginationParams): Promise<IPaginatedResponse<UserEntity>> {
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
}
