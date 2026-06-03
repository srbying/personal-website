import { resumePdf } from "./launchAssets";
import { experiencePreview } from "./experience";

export type HomeCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type HomeHero = {
  eyebrow: string;
  headline: string;
  supportingLine: string;
  metadata: string;
  ctas: readonly HomeCta[];
};

export type RecentExperienceItem = {
  company: string;
  role: string;
  dateRange: string;
};

export type LeadershipPrinciple = {
  title: string;
  sentence: string;
};

export const homeHero = {
  eyebrow: "Steven Byington",
  headline: "Software Engineering Manager",
  supportingLine:
    "I help product-minded teams build with clarity, ownership, and technical judgment.",
  metadata: "Engineering Manager · Full-Stack Depth · USMC Veteran",
  ctas: [
    {
      label: "Download My Resume",
      href: resumePdf.path,
      variant: "primary"
    },
    {
      label: "See My Experience",
      href: "/experience/",
      variant: "secondary"
    }
  ]
} satisfies HomeHero;

export const recentExperience = experiencePreview satisfies readonly RecentExperienceItem[];

export const leadershipPrinciples = [
  {
    title: "Clarity",
    sentence:
      "I make priorities, tradeoffs, and success criteria explicit before momentum builds."
  },
  {
    title: "Accountability",
    sentence:
      "I treat accountability as a shared standard: own the outcome, keep the team informed, and close the loop."
  },
  {
    title: "Ownership",
    sentence:
      "I help people see the customer, system, and business outcomes behind their decisions."
  },
  {
    title: "Calm Under Pressure",
    sentence:
      "I steady the room, narrow the problem, and keep action moving when complexity spikes."
  },
  {
    title: "Respectful Candor",
    sentence:
      "I give feedback early, specifically, and with enough care that it can actually be used."
  },
  {
    title: "Technical Judgment",
    sentence:
      "I balance product speed with architecture, reliability, and the maintenance cost of choices."
  }
] satisfies readonly LeadershipPrinciple[];

export const closingCtas = [
  {
    label: "Download My Resume",
    href: resumePdf.path,
    variant: "primary"
  },
  {
    label: "Contact Steven",
    href: "/contact/",
    variant: "secondary"
  }
] satisfies readonly HomeCta[];
