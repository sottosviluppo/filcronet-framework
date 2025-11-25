import type { IHttpClient } from "@sottosviluppo/frontend-core";

export interface IAuthHttpClient extends IHttpClient {
  setAuthToken(token: string | null): void;
  setupAutoRefresh(refreshCallback: () => Promise<string>): void;
  onUnauthorized(callback: () => void): void;
}
