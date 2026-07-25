export interface UserRepoDto {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  watchers: number;
  forks: number;
  openIssues: number;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
  homepage: string | null;
  sizeKb: number;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
}
