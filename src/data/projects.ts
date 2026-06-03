import {
  hasConfirmedHref,
  projectLinks,
  projectScreenshots,
  type LaunchAsset,
  type PublicLink
} from "./launchAssets";

export type ProjectAction = {
  label: string;
  href: string;
  isExternal: boolean;
};

export type ProjectSummary = {
  id: string;
  title: string;
  summary: string;
  description: string;
  detailHref?: string;
  previewScreenshot: LaunchAsset;
  screenshots: readonly LaunchAsset[];
  actions: readonly ProjectAction[];
  builtWith?: readonly string[];
};

function externalProjectAction(link: PublicLink): ProjectAction | undefined {
  if (!hasConfirmedHref(link)) {
    return undefined;
  }

  return {
    label: link.label,
    href: link.href,
    isExternal: link.isExternal
  };
}

function requireAction(action: ProjectAction | undefined): ProjectAction {
  if (!action) {
    throw new Error("Expected confirmed project link");
  }

  return action;
}

export const projects = [
  {
    id: "aeris",
    title: "Aeris",
    summary:
      "A personal fitness analytics tool for understanding speed and fitness progress through trends, comparisons, and progress insights.",
    description:
      "Aeris turns Garmin running data into a focused product story about progress, effort-matched comparisons, and data-grounded fitness questions.",
    detailHref: "/projects/aeris/",
    previewScreenshot: projectScreenshots.aeris[0],
    screenshots: projectScreenshots.aeris,
    actions: [
      {
        label: "Read the story",
        href: "/projects/aeris/",
        isExternal: false
      },
      requireAction(externalProjectAction(projectLinks.aeris.liveApp)),
      requireAction(externalProjectAction(projectLinks.aeris.github))
    ],
    builtWith: [
      "Next.js",
      "TypeScript",
      "Supabase Postgres",
      "Recharts",
      "PapaParse",
      "Zod",
      "OpenAI Responses API",
      "Vercel"
    ]
  },
  {
    id: "soilos",
    title: "Soilos",
    summary:
      "A personal lawn-care planning app framed through market research, seasonal planning, budget tracking, and product thinking.",
    description:
      "Soilos explores how research, product modeling, and practical planning can make lawn-care decisions easier to compare.",
    previewScreenshot: projectScreenshots.soilos[0],
    screenshots: projectScreenshots.soilos,
    actions: []
  }
] satisfies readonly ProjectSummary[];

export function getProjectById(projectId: string): ProjectSummary | undefined {
  return projects.find((project) => project.id === projectId);
}
