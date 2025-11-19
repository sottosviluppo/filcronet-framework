import { UserEntity } from "../entities/user.entity";

export interface UserCreatedWithInvitation {
  user: UserEntity;
  invitationToken: string;
  invitationUrl: string;
}

/**
 * Response when user is created without password
 */
export interface CreateUserWithInvitationResponse {
  user: Omit<UserEntity, "password">;
  invitationToken: string;
  invitationUrl: string;
  message: string;
}

/**
 * Response when user is created with password
 */
export interface CreateUserResponse {
  user: Omit<UserEntity, "password">;
  message: string;
}
