import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GithubApiClient, GithubApiError } from './github-api.client';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRepoDto } from './dto/user-repo.dto';
import { UserActivityDto } from './dto/user-activity.dto';
import type {
  RawGithubEvent,
  RawGithubRepo,
  RawGithubUser,
} from './types/github-api.types';

@Injectable()
export class UserService {
  constructor(private readonly githubApiClient: GithubApiClient) {}

  async getProfile(username: string): Promise<UserProfileDto> {
    const raw = await this.fetchFromGithub<RawGithubUser>(
      `/users/${username}`,
      username,
    );
    return this.toProfileDto(raw);
  }

  async getRepos(username: string): Promise<UserRepoDto[]> {
    const raw = await this.fetchFromGithub<RawGithubRepo[]>(
      `/users/${username}/repos?sort=updated&per_page=100`,
      username,
    );
    return raw.map((repo) => this.toRepoDto(repo));
  }

  async getActivity(username: string): Promise<UserActivityDto[]> {
    const raw = await this.fetchFromGithub<RawGithubEvent[]>(
      `/users/${username}/events/public`,
      username,
    );
    return raw.map((event) => this.toActivityDto(event));
  }

  private async fetchFromGithub<T>(path: string, username: string): Promise<T> {
    try {
      return await this.githubApiClient.get<T>(path);
    } catch (error) {
      throw this.toHttpException(error, username);
    }
  }

  private toHttpException(error: unknown, username: string): HttpException {
    if (!(error instanceof GithubApiError)) {
      return new HttpException(
        'Error inesperado consultando la API de GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (error.status === 404) {
      return new NotFoundException(
        `No existe un usuario de GitHub llamado "${username}"`,
      );
    }

    if (error.status === 403 || error.status === 429) {
      return new HttpException(
        'Se alcanzó el límite de requests de la API de GitHub. Probá de nuevo en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return new HttpException(
      `Error consultando la API de GitHub: ${error.message}`,
      HttpStatus.BAD_GATEWAY,
    );
  }

  private toProfileDto(raw: RawGithubUser): UserProfileDto {
    return {
      username: raw.login,
      name: raw.name,
      avatarUrl: raw.avatar_url,
      bio: raw.bio,
      company: raw.company,
      location: raw.location,
      blog: raw.blog || null,
      email: raw.email,
      hireable: raw.hireable,
      twitterUsername: raw.twitter_username,
      publicRepos: raw.public_repos,
      publicGists: raw.public_gists,
      followers: raw.followers,
      following: raw.following,
      profileUrl: raw.html_url,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }

  private toRepoDto(raw: RawGithubRepo): UserRepoDto {
    return {
      name: raw.name,
      fullName: raw.full_name,
      description: raw.description,
      url: raw.html_url,
      language: raw.language,
      stars: raw.stargazers_count,
      watchers: raw.watchers_count,
      forks: raw.forks_count,
      openIssues: raw.open_issues_count,
      topics: raw.topics ?? [],
      isFork: raw.fork,
      isArchived: raw.archived,
      homepage: raw.homepage || null,
      sizeKb: raw.size,
      license: raw.license?.name ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      pushedAt: raw.pushed_at,
    };
  }

  private toActivityDto(raw: RawGithubEvent): UserActivityDto {
    return {
      id: raw.id,
      type: raw.type ?? 'Event',
      repoName: raw.repo.name,
      repoUrl: `https://github.com/${raw.repo.name}`,
      description: this.describeEvent(raw),
      createdAt: raw.created_at ?? new Date().toISOString(),
    };
  }

  private describeEvent(raw: RawGithubEvent): string {
    switch (raw.type) {
      case 'PushEvent': {
        const branch = raw.payload.ref?.replace('refs/heads/', '');
        return branch
          ? `Hizo push a la rama "${branch}"`
          : 'Hizo push de cambios';
      }
      case 'CreateEvent':
        return `Creó ${this.describeRefType(raw.payload.ref_type)}`;
      case 'DeleteEvent':
        return `Eliminó ${this.describeRefType(raw.payload.ref_type)}`;
      case 'WatchEvent':
        return 'Marcó el repositorio con una estrella';
      case 'ForkEvent':
        return 'Hizo un fork del repositorio';
      case 'IssuesEvent':
        return `${this.describeAction(raw.payload.action)} un issue${raw.payload.issue ? `: "${raw.payload.issue.title}"` : ''}`;
      case 'IssueCommentEvent':
        return 'Comentó en un issue';
      case 'PullRequestEvent':
        return `${this.describeAction(raw.payload.action)} un pull request${raw.payload.pull_request ? `: "${raw.payload.pull_request.title}"` : ''}`;
      case 'PullRequestReviewEvent':
        return 'Revisó un pull request';
      case 'ReleaseEvent':
        return `Publicó la release ${raw.payload.release?.tag_name ?? ''}`.trim();
      case 'PublicEvent':
        return 'Hizo público el repositorio';
      default:
        return raw.type ? `Actividad: ${raw.type}` : 'Actividad';
    }
  }

  private describeRefType(refType?: string): string {
    switch (refType) {
      case 'branch':
        return 'una rama';
      case 'tag':
        return 'un tag';
      case 'repository':
        return 'el repositorio';
      default:
        return 'algo';
    }
  }

  private describeAction(action?: string): string {
    switch (action) {
      case 'opened':
        return 'Abrió';
      case 'closed':
        return 'Cerró';
      case 'reopened':
        return 'Reabrió';
      default:
        return 'Actualizó';
    }
  }
}
