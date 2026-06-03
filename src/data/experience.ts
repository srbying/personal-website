export type ExperiencePageContent = {
  kicker: string;
  title: string;
  lead: string;
  facts: readonly {
    label: string;
    value: string;
  }[];
  timelineHeading: string;
  timelineLead: string;
  militaryHeading: string;
};

export type ExperienceRole = {
  id: string;
  company: string;
  role: string;
  dateRange: string;
  context?: string;
  progressionLabel?: string;
  summary: string;
  impacts: readonly string[];
  technologies?: readonly string[];
};

export type ExperiencePreviewItem = {
  company: string;
  role: string;
  dateRange: string;
};

export const experiencePage = {
  kicker: "Experience",
  title: "Role history with product-minded impact",
  lead:
    "A focused look at Steven's private-sector engineering path, role progression, selected impact, and the leadership foundation that shapes how he manages teams.",
  facts: [
    {
      label: "Current focus",
      value: "Engineering management for growth, onboarding, purchasing, and collaboration work"
    },
    {
      label: "Technical base",
      value: "10+ years of full-stack product engineering across frontend, backend, and systems"
    },
    {
      label: "Leadership signal",
      value: "USMC veteran with a calm, accountable operating style"
    }
  ],
  timelineHeading: "Private-sector experience",
  timelineLead:
    "Recent roles keep month-and-year dates for chronology. Earlier consulting work stays compact while preserving the shape of the path.",
  militaryHeading: "Military Service"
} satisfies ExperiencePageContent;

export const experienceRoles = [
  {
    id: "animoto-manager",
    company: "Animoto",
    role: "Software Engineering Manager",
    dateRange: "Mar 2025 - Present",
    context: "Leading customer-facing growth engineering team",
    progressionLabel: "Animoto progression",
    summary:
      "Leads a customer-facing growth engineering team across onboarding, purchasing, collaboration features, engineering system health, and team development.",
    impacts: [
      "Manage and develop a cross-level team responsible for the growth funnel, customer onboarding, purchasing workflows, engineering system health, and customer collaboration features.",
      "Grew an intermediate engineer from day one through her first pull request, then progressively expanded her ownership from small features to leading a full technical plan.",
      "Developed a newly promoted senior engineer as a leadership point person, creating space for her to build management judgment while still driving team outcomes.",
      "Diagnosed the slow database queries flooding on-call alerting, advocated for a fix, and implemented it, improving query latency from 1m 25s to 5ms while reducing database strain.",
      "Led a payment fraud mitigation initiative across WAF configuration, Braintree fraud rules, Datadog monitors, historical fraud attempts, chargebacks, third-party tooling, SMS 2FA, and email verification options.",
      "Analyzed Jira and GitHub workflow data to address pull request bottlenecks, then created a department-wide review process guide with SLA's and alignment sessions.",
      "Built a weighted backlog scoring worksheet using risk, complexity, deadlines, and cost to improve leadership planning and surface overlooked risks such as compliance-critical Ruby upgrades.",
      "Navigated a critical Kubernetes end-of-life infrastructure risk by clearing roadmap space for the strongest infrastructure engineer, protecting focus, and securing leadership support for a dedicated infrastructure hire."
    ],
    technologies: ["Ruby", "Kubernetes", "Braintree", "Datadog", "Jira", "GitHub"]
  },
  {
    id: "animoto-senior-engineer",
    company: "Animoto",
    role: "Senior Full Stack Software Engineer",
    dateRange: "Mar 2021 - Apr 2025",
    progressionLabel: "Animoto progression",
    summary:
      "Served as engineer, Scrum Master, and technical lead on high-visibility product initiatives while building leadership credibility across delivery and architecture.",
    impacts: [
      "Served simultaneously as engineer, Scrum Master, and tech lead, delivering the Pro Trial experience on time with minimal defects while coordinating team ceremonies and cross-department release logistics.",
      "Proposed and drove adoption of a Scrum/Kanban hybrid for a company rebrand project, gained team buy-in, and kept delivery on track after stepping in to own the majority of a pricing integration.",
      "Presented on Next.js 14 at Redbrick DevCon, sparking cross-team technical discussion and increasing visibility as an engineering leader.",
      "Maintained team composure and momentum through company and team transitions by creating retro space for difficult conversations, communicating timeline shifts early, and keeping delivery moving."
    ],
    technologies: ["Next.js 14", "React", "Scrum", "Kanban", "Pricing systems"]
  },
  {
    id: "nike-full-stack-engineer",
    company: "Nike",
    role: "Full Stack Engineer",
    dateRange: "Feb 2018 - Mar 2021",
    context: "Contract",
    summary:
      "Delivered internal product systems, component architecture, and infrastructure migrations for merchant and platform workflows.",
    impacts: [
      "Architected and delivered a department-wide internal component style guide using React, TypeScript, and Web Components, adopted across multiple teams to unify UI and UX.",
      "Led proof-of-concept development for a new global merchant workflow application and provided regular demos and progress updates to merchants and project stakeholders.",
      "Increased unit test coverage of core libraries from 0% to over 90% using Mocha, Chai, and Sinon.",
      "Translated a legacy Java SSO service into Node.js and led infrastructure migration from Chef, Go, and CircleCI to Jenkins ahead of schedule.",
      "Integrated data from internal APIs using vertical slice delivery, updated product schema with MyBatis, built Node services and daemons for data processing, and debugged collection and storage in AWS."
    ],
    technologies: ["React", "TypeScript", "Web Components", "Node.js", "AWS", "Jenkins"]
  },
  {
    id: "discoverorg-software-developer",
    company: "DiscoverOrg (now ZoomInfo)",
    role: "Software Developer",
    dateRange: "Nov 2016 - Feb 2018",
    summary:
      "Built shared frontend systems, improved delivery tooling, and contributed to developer mentorship and hiring practices.",
    impacts: [
      "Led an effort to reduce code repetition by introducing a shared component library across the UI codebase and integrating Babel for ES2015+ support.",
      "Wired front-end test suites into Jenkins for continuous delivery.",
      "Served as a core team member for engineering interviews, mentorship of new front-end developers, and component architecture documentation."
    ],
    technologies: ["JavaScript", "Babel", "Jenkins", "Shared components"]
  },
  {
    id: "catalyst-software-developer",
    company: "Catalyst DevWorks",
    role: "Software Developer",
    dateRange: "Mar 2015 - Nov 2016",
    summary:
      "Delivered API, offline resilience, export, and documentation work for client-facing software projects.",
    impacts: [
      "Built a Node.js and Swagger RESTful API, including service workers to defer post requests for improved offline resilience.",
      "Created a data export service supporting PDF and CSV output and authored front-end documentation using ESDoc."
    ],
    technologies: ["Node.js", "Swagger", "Service workers", "PDF", "CSV", "ESDoc"]
  },
  {
    id: "renovate-healthsparq-consultant",
    company: "Renovate America / HealthSparq",
    role: "Consultant - Software Engineer",
    dateRange: "2015 - 2016",
    summary:
      "Supported consulting engagements across offline desktop delivery and healthcare provider search modernization.",
    impacts: [
      "Built an Electron.js desktop shell for offline web application delivery.",
      "Upgraded an insurance provider search application using Ember.js, Sass, and jQuery, and added dynamically generated provider directory PDFs via JasperReports."
    ],
    technologies: ["Electron.js", "Ember.js", "Sass", "jQuery", "JasperReports"]
  }
] satisfies readonly ExperienceRole[];

export const experiencePreview = [
  {
    company: "Animoto",
    role: "Senior Full Stack Software Engineer to Software Engineering Manager",
    dateRange: "Mar 2021 - Present"
  },
  {
    company: "Nike",
    role: "Full Stack Engineer",
    dateRange: "Feb 2018 - Mar 2021"
  },
  {
    company: "DiscoverOrg (now ZoomInfo)",
    role: "Software Developer",
    dateRange: "Nov 2016 - Feb 2018"
  }
] satisfies readonly ExperiencePreviewItem[];

export const experienceMilitaryService = {
  role: "Fire Team Leader & Radio Operator, Command Center",
  organization: "United States Marine Corps Reserve",
  dateRange: "2003 - 2009",
  summary:
    "Led a fire team of 4 Marines in an active combat zone, building a leadership foundation grounded in composure under pressure, rapid decision-making with incomplete information, and unwavering accountability for the people in my charge."
} as const;
