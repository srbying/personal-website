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

export const resumeExperience = [
  {
    role: "Software Engineering Manager",
    company: "Animoto",
    dateRange: "Mar 2025 - Present",
    context: "Leading customer-facing growth engineering team",
    bullets: [
      "Manage and develop a cross-level team responsible for the growth funnel, customer onboarding, purchasing workflows, engineering system health, and customer collaboration features.",
      "Grew an intermediate engineer from day one through her first pull request, then progressively expanded her ownership from small features to leading a full technical plan.",
      "Developed a newly promoted senior engineer as a leadership point person, creating space for her to build management judgment while still driving team outcomes.",
      "Diagnosed the slow database queries flooding on-call alerting, advocated for a fix, and implemented it, improving query latency from 1m 25s to 5ms while reducing database strain.",
      "Led a payment fraud mitigation initiative across WAF configuration, Braintree fraud rules, Datadog monitors, historical fraud attempts, chargebacks, third-party tooling, SMS 2FA, and email verification options.",
      "Analyzed Jira and GitHub workflow data to address pull request bottlenecks, then created a department-wide review process guide with SLA's and alignment sessions.",
      "Built a weighted backlog scoring worksheet using risk, complexity, deadlines, and cost to improve leadership planning and surface overlooked risks such as compliance-critical Ruby upgrades.",
      "Navigated a critical Kubernetes end-of-life infrastructure risk by clearing roadmap space for the strongest infrastructure engineer, protecting focus, and securing leadership support for a dedicated infrastructure hire."
    ]
  },
  {
    role: "Senior Full Stack Software Engineer",
    company: "Animoto",
    dateRange: "Mar 2021 - Apr 2025",
    bullets: [
      "Served simultaneously as engineer, Scrum Master, and tech lead, delivering the Pro Trial experience on time with minimal defects while coordinating team ceremonies and cross-department release logistics.",
      "Proposed and drove adoption of a Scrum/Kanban hybrid for a company rebrand project, gained team buy-in, and kept delivery on track after stepping in to own the majority of a pricing integration.",
      "Presented on Next.js 14 at Redbrick DevCon, sparking cross-team technical discussion and increasing visibility as an engineering leader.",
      "Maintained team composure and momentum through company and team transitions by creating retro space for difficult conversations, communicating timeline shifts early, and keeping delivery moving."
    ]
  },
  {
    role: "Full Stack Engineer",
    company: "Nike",
    dateRange: "Feb 2018 - Mar 2021",
    context: "Contract",
    bullets: [
      "Architected and delivered a department-wide internal component style guide using React, TypeScript, and Web Components, adopted across multiple teams to unify UI and UX.",
      "Led proof-of-concept development for a new global merchant workflow application and provided regular demos and progress updates to merchants and project stakeholders.",
      "Increased unit test coverage of core libraries from 0% to over 90% using Mocha, Chai, and Sinon.",
      "Translated a legacy Java SSO service into Node.js and led infrastructure migration from Chef, Go, and CircleCI to Jenkins ahead of schedule.",
      "Integrated data from internal APIs using vertical slice delivery, updated product schema with MyBatis, built Node services and daemons for data processing, and debugged collection and storage in AWS."
    ]
  },
  {
    role: "Software Developer",
    company: "DiscoverOrg (now ZoomInfo)",
    dateRange: "Nov 2016 - Feb 2018",
    bullets: [
      "Led an effort to reduce code repetition by introducing a shared component library across the UI codebase and integrating Babel for ES2015+ support.",
      "Wired front-end test suites into Jenkins for continuous delivery.",
      "Served as a core team member for engineering interviews, mentorship of new front-end developers, and component architecture documentation."
    ]
  },
  {
    role: "Software Developer",
    company: "Catalyst DevWorks",
    dateRange: "Mar 2015 - Nov 2016",
    bullets: [
      "Built a Node.js and Swagger RESTful API, including service workers to defer post requests for improved offline resilience.",
      "Created a data export service supporting PDF and CSV output and authored front-end documentation using ESDoc."
    ]
  },
  {
    role: "Consultant - Software Engineer",
    company: "Renovate America / HealthSparq",
    dateRange: "2015 - 2016",
    bullets: [
      "Built an Electron.js desktop shell for offline web application delivery.",
      "Upgraded an insurance provider search application using Ember.js, Sass, and jQuery, and added dynamically generated provider directory PDFs via JasperReports."
    ]
  }
] satisfies readonly ResumeExperienceItem[];

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
      "Node.js",
      "Ruby",
      "API design",
      "Swagger",
      "MyBatis",
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
  role: "Fire Team Leader & Radio Operator, Command Center",
  organization: "United States Marine Corps Reserve",
  dateRange: "2003 - 2009",
  summary:
    "Led a fire team of 4 Marines in an active combat zone, building a leadership foundation grounded in composure under pressure, rapid decision-making with incomplete information, and unwavering accountability for the people in my charge."
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
