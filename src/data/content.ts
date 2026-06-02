export type ProjectContent = {
  id: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
};

export type ExperienceContent = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  summary: string;
};

export const contentSources = {
  projects: "src/data/projects.json",
  experience: "src/data/experience.json",
  launchAssets: "src/data/launchAssets.ts"
} as const;
