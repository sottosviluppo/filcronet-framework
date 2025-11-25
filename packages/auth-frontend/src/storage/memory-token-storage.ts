import { MemoryStorage } from "@sottosviluppo/frontend-core";
import { ITokenStorage } from "../interfaces/token-storage.interface";

enum StorageKey {
  ACCESS_TOKEN = "access_token",
  USER = "user",
}

export class MemoryTokenStorage implements ITokenStorage {
  private storage = new MemoryStorage();

  getToken(): string | null {
    return this.storage.get<string>(StorageKey.ACCESS_TOKEN);
  }

  setToken(token: string): void {
    this.storage.set(StorageKey.ACCESS_TOKEN, token);
  }

  removeToken(): void {
    this.storage.remove(StorageKey.ACCESS_TOKEN);
  }

  getUser<T>(): T | null {
    return this.storage.get<T>(StorageKey.USER);
  }

  setUser<T>(user: T): void {
    this.storage.set(StorageKey.USER, user);
  }

  removeUser(): void {
    this.storage.remove(StorageKey.USER);
  }

  clear(): void {
    this.storage.clear();
  }

  hasToken(): boolean {
    return this.storage.has(StorageKey.ACCESS_TOKEN);
  }
}
