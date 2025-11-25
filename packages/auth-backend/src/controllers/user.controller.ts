import { IApiResponse, IPaginationParams } from "@sottosviluppo/core";
import { ResponseHelper } from "../utils/response.helper";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserEntity } from "../entities/user.entity";
import {
  CreateUserResponse,
  CreateUserWithInvitationResponse,
} from "../interfaces/user-invitation.interface";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserService } from "../services/user.service";
import { PermissionsGuard } from "../guards/permissions.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("Users")
@Controller({ path: "users", version: "1" })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequirePermissions("users:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new user" })
  async create(
    @Body() createUserDto: CreateUserDto
  ): Promise<
    IApiResponse<CreateUserResponse | CreateUserWithInvitationResponse>
  > {
    const result = await this.userService.create(createUserDto);

    if ("invitationToken" in result) {
      const response: CreateUserWithInvitationResponse = {
        user: result.user.toSafeObject(),
        invitationToken: result.invitationToken,
        invitationUrl: result.invitationUrl,
        message: "User created successfully. Invitation token generated.",
      };
      return ResponseHelper.success(response, response.message);
    }

    const response: CreateUserResponse = {
      user: result.toSafeObject(),
      message: "User created successfully",
    };
    return ResponseHelper.success(response, response.message);
  }

  @Get()
  @RequirePermissions("users:list")
  @ApiOperation({ summary: "List all users with pagination" })
  async findAll(
    @Query() pagination: IPaginationParams
  ): Promise<IApiResponse<UserEntity[]>> {
    const result = await this.userService.findAll(pagination);

    // IPaginatedResponse already has success/data structure
    // but we need to wrap it in IApiResponse
    return {
      success: true,
      data: result.data,
      meta: {
        timestamp: new Date().toISOString(),
      },
      // Add pagination info to meta instead of root level
      pagination: result.pagination,
    } as any; // Type assertion needed, consider extending IApiResponse for paginated responses
  }

  @Get(":id")
  @RequirePermissions("users:read")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<UserEntity>> {
    const user = await this.userService.findOne(id);
    return ResponseHelper.success(user);
  }

  @Patch(":id")
  @RequirePermissions("users:update")
  @ApiOperation({ summary: "Update user" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<IApiResponse<UserEntity>> {
    const user = await this.userService.update(id, updateUserDto);
    return ResponseHelper.success(user, "User updated successfully");
  }

  @Delete(":id")
  @RequirePermissions("users:delete")
  @HttpCode(HttpStatus.OK) // Changed from NO_CONTENT to return response
  @ApiOperation({ summary: "Delete user" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<void>> {
    await this.userService.remove(id);
    return ResponseHelper.successMessage("User deleted successfully");
  }
}
