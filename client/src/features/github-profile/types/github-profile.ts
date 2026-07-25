export interface GithubProfile {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  hireable: boolean | null;
  twitterUsername: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  profileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GithubRepo {
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

export interface GithubActivity {
  id: string;
  type: string;
  repoName: string;
  repoUrl: string;
  description: string;
  createdAt: string;
}
