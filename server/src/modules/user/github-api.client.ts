import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../shared/config/configuration';

export class GithubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GithubApiError';
  }
}

@Injectable()
export class GithubApiClient {
  private readonly logger = new Logger(GithubApiClient.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.baseUrl = configService.get('github.apiUrl', { infer: true });
    this.token = configService.get('github.token', { infer: true });
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const message = await this.extractErrorMessage(response);
      this.logger.warn(
        `GitHub API respondió ${response.status} en ${path}: ${message}`,
      );
      throw new GithubApiError(message, response.status);
    }

    return response.json() as Promise<T>;
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    return body?.message ?? response.statusText;
  }
}
