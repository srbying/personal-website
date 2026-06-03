import { resumePdf } from "./launchAssets";

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

export const recentExperience = [
  {
    company: "Animoto",
    role: "Senior Full Stack Software Engineer to Software Engineering Manager",
    dateRange: "Mar 2021-2026"
  },
  {
    company: "Nike",
    role: "Full Stack Engineer",
    dateRange: "Feb 2018-Mar 2021"
  },
  {
    company: "DiscoverOrg (now ZoomInfo)",
    role: "Software Developer",
    dateRange: "Nov 2016-Feb 2018"
  }
] satisfies readonly RecentExperienceItem[];

export const leadershipPrinciples = [
  {
    title: "Clarity",
    sentence:
      "I make priorities, tradeoffs, and success criteria explicit before momentum builds."
  },
  {
    title: "Accountability",
    sentence:
      "I set direct expectations and follow through with the same standards I ask of the team."
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
