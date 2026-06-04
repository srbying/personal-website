import {
  experienceMilitaryService as sharedExperienceMilitaryService,
  experienceRoles
} from "./experience";
import { contactLinks, resumePdf } from "./launchAssets";

export type ResumeExperienceItem = {
  role: string;
  company: string;
  dateRange: string;
  context?: string;
  bullets: readonly string[];
};

export type ResumeSkillGroup = {
  group: string;
  skills: readonly string[];
};

export type ResumeCredential = {
  name: string;
  issuer: string;
};

export type ResumeContactLink = {
  label: string;
  href: string;
  displayText: string;
  isExternal: boolean;
};

export const resumeHeader = {
  name: "Steven Byington",
  role: "Software Engineering Manager",
  positioning: "Engineering Manager for product-minded teams",
  lead:
    "I help product-minded teams build with clarity, ownership, and technical judgment.",
  pdfLabel: "Download Resume PDF",
  pdfPath: resumePdf.path
} as const;

export const resumeSummary = [
  "Engineering Manager with 10+ years of full-stack software engineering experience and a track record of leading product-minded teams through ambiguity, delivery pressure, and technical change.",
  "Known for growing engineers, making priorities and tradeoffs explicit, improving engineering systems, and connecting engineering work to customer and business outcomes.",
  "Marine Corps veteran who brings calm, accountable leadership to teams that need steady execution and sound technical judgment."
] satisfies readonly string[];

export const resumeExperience = experienceRoles.map(
  ({ role, company, dateRange, context, impacts }) => ({
    role,
    company,
    dateRange,
    context,
    bullets: impacts
  })
) satisfies readonly ResumeExperienceItem[];

export const resumeSkillGroups = [
  {
    group: "Leadership & Delivery",
    skills: [
      "Engineering management",
      "Technical planning",
      "Roadmapping",
      "Agile/Scrum",
      "Kanban",
      "PR process design",
      "Mentorship"
    ]
  },
  {
    group: "Frontend",
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Web Components",
      "Design systems"
    ]
  },
  {
    group: "Backend",
    skills: [
      "Java",
      "Node.js",
      "Ruby",
      "Ruby on Rails",
      "Graphql",
      "API design",
      "Data processing"
    ]
  },
  {
    group: "Cloud & Infrastructure",
    skills: [
      "Kubernetes",
      "AWS",
      "Jenkins",
      "CI/CD",
      "Braintree",
      "Electron.js"
    ]
  },
  {
    group: "Data & Observability",
    skills: [
      "Datadog",
      "Query performance",
      "Operational alerting",
      "Fraud analysis",
      "AI-assisted development workflows"
    ]
  }
] satisfies readonly ResumeSkillGroup[];

export const resumeCredentials = [
  {
    name: "Scrum Master Certified (SMC)",
    issuer: "Scrum Inc."
  },
  {
    name: "Bachelor of Science, Design and Visual Communications",
    issuer: "Bowling Green State University"
  }
] satisfies readonly ResumeCredential[];

export const resumeMilitaryService = {
  role: sharedExperienceMilitaryService.role,
  organization: sharedExperienceMilitaryService.organization,
  dateRange: sharedExperienceMilitaryService.dateRange,
  summary: sharedExperienceMilitaryService.summary
} as const;

export const resumeContactLinks = [
  {
    label: "Email",
    href: contactLinks.email.href,
    displayText: contactLinks.email.displayText,
    isExternal: contactLinks.email.isExternal
  },
  {
    label: "LinkedIn",
    href: contactLinks.linkedIn.href,
    displayText: contactLinks.linkedIn.displayText,
    isExternal: contactLinks.linkedIn.isExternal
  },
  {
    label: "GitHub",
    href: contactLinks.github.href,
    displayText: contactLinks.github.displayText,
    isExternal: contactLinks.github.isExternal
  },
  {
    label: "Resume PDF",
    href: resumePdf.path,
    displayText: resumePdf.path,
    isExternal: false
  }
] satisfies readonly ResumeContactLink[];
