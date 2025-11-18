import axios, { AxiosInstance } from "axios";
import type {
  AuthConfig,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "../types";
import { TokenStorage } from "../utils";

/**
 * Authentication API client
 * Handles all API calls related to authentication
 *
 * @export
 * @class AuthApi
 */
export class AuthApi {
  private client: AxiosInstance;
  private tokenStorage: TokenStorage;
  private config: AuthConfig;

  /**
   * Creates an instance of AuthApi
   *
   * @param {AuthConfig} config - Authentication configuration
   * @memberof AuthApi
   */
  constructor(config: AuthConfig) {
    this.config = config;
    this.tokenStorage = new TokenStorage(config.storage);

    const baseURL = config.apiVersion
      ? `${config.apiBaseUrl}/${config.apiVersion}`
      : config.apiBaseUrl;

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests automatically
    this.client.interceptors.request.use((config) => {
      const token = this.tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.tokenStorage.clear();

          if (this.config.redirectOnUnauth && typeof window !== "undefined") {
            window.location.href = this.config.redirectOnUnauth;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Logs in user with credentials
   *
   * @param {LoginCredentials} credentials - User login credentials
   * @returns {Promise<AuthResponse>} Authentication response with user and token
   * @memberof AuthApi
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    this.tokenStorage.setToken(response.data.accessToken);
    this.tokenStorage.setUser(response.data.user);

    return response.data;
  }

  /**
   * Registers a new user
   *
   * @param {RegisterData} data - User registration data
   * @returns {Promise<AuthResponse>} Authentication response with user and token
   * @memberof AuthApi
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/register",
      data
    );

    this.tokenStorage.setToken(response.data.accessToken);
    this.tokenStorage.setUser(response.data.user);

    return response.data;
  }

  /**
   * Logs out current user
   * Clears local authentication data
   *
   * @returns {Promise<void>}
   * @memberof AuthApi
   */
  async logout(): Promise<void> {
    this.tokenStorage.clear();
  }

  /**
   * Fetches current authenticated user profile
   *
   * @returns {Promise<any>} User profile data
   * @memberof AuthApi
   */
  async getCurrentUser(): Promise<any> {
    const response = await this.client.get("/auth/me");

    this.tokenStorage.setUser(response.data);

    return response.data;
  }

  /**
   * Refreshes authentication token
   *
   * @returns {Promise<string>} New access token
   * @memberof AuthApi
   */
  async refreshToken(): Promise<string> {
    const response = await this.client.post<{ accessToken: string }>(
      "/auth/refresh"
    );

    this.tokenStorage.setToken(response.data.accessToken);

    return response.data.accessToken;
  }

  /**
   * Gets the Axios client instance for custom API calls
   *
   * @returns {AxiosInstance}
   * @memberof AuthApi
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}
