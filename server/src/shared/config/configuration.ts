export interface AppConfig {
  port: number;
  corsOrigin: string;
  github: {
    apiUrl: string;
    token: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4001',
  github: {
    apiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com',
    token: process.env.GITHUB_TOKEN ?? '',
  },
});
