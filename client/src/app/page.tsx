import { getGithubProfile } from "@/features/github-profile/services/get-github-profile";
import { getGithubRepos } from "@/features/github-profile/services/get-github-repos";
import { getGithubActivity } from "@/features/github-profile/services/get-github-activity";
import { ProfileExplorer } from "@/features/github-profile";

const DEFAULT_USERNAME = "franpa13";

export default async function Home() {
  const [profile, repos, activity] = await Promise.all([
    getGithubProfile(DEFAULT_USERNAME),
    getGithubRepos(DEFAULT_USERNAME),
    getGithubActivity(DEFAULT_USERNAME),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <ProfileExplorer initialProfile={profile} initialRepos={repos} initialActivity={activity} />
    </main>
  );
}
