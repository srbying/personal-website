import { resumePdf } from "./launchAssets";

export type AboutCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type AboutLeadershipBelief = {
  title: string;
  body: string;
};

export type AboutPageContent = {
  title: string;
  description: string;
  canonicalPath: string;
  kicker: string;
  headline: string;
  leadershipHeading: string;
  leadershipKicker: string;
  outsideWorkHeading: string;
  outsideWorkKicker: string;
  closeKicker: string;
  closeHeading: string;
};

export const aboutPage = {
  title: "About",
  description:
    "About Steven Byington's engineering leadership, full-stack experience, Marine Corps foundation, and personal operating style.",
  canonicalPath: "/about/",
  kicker: "About",
  headline: "I think in miles, not sprints.",
  leadershipHeading: "How I Lead",
  leadershipKicker: "Leadership",
  outsideWorkHeading: "Outside the Work",
  outsideWorkKicker: "Personal Texture",
  closeKicker: "Resume and contact",
  closeHeading: "Want the concise version?"
} satisfies AboutPageContent;

export const aboutOpeningParagraphs = [
  "I'm an Engineering Manager with more than a decade of full-stack engineering experience. I help teams understand the work, the reason behind it, and the path through it. Less noise. More ownership.",
  "For me, engineering leadership runs on trust. Titles do not create it. Consistency does. So does honesty, follow-through, and taking care of your people the way you would want to be taken care of.",
  "That shows up in the day to day: saying what is working and what is not, giving engineers room to do their best work, and making sure the work connects back to why it matters.",
  "I learned that before I ever worked in software. In the Marine Corps, servant leadership was not a framework. It was how things worked. You earned trust by leading from alongside your people, not above them. I've carried that into every team I've been part of."
] satisfies readonly string[];

export const aboutLeadershipBeliefs = [
  {
    title: "Integrity over optics",
    body:
      "I say what I mean and give feedback early. I treat honesty as respect. My job is to give people the clarity and confidence to do great work."
  },
  {
    title: "Trust over oversight",
    body:
      "Smart engineers do their best work with context and room to own decisions. I hire capable people, back their judgment, and clear things out of the way."
  },
  {
    title: "Team health first",
    body:
      "Healthy teams build better software. I fight for clear priorities and protect focus. Engineers should have a voice in the technical work they know needs to happen."
  },
  {
    title: "Always improve",
    body:
      "Systems can get better. Processes can get better. People can too. I care about the unglamorous work, especially fixing broken patterns and paying down debt. I also care about developing people for what comes next."
  }
] satisfies readonly AboutLeadershipBelief[];

export const aboutOutsideWorkParagraphs = [
  "I'm a U.S. Marine Corps veteran, trail runner, and ultramarathoner. The Marines and running both shaped how I lead.",
  "The Marines taught me that leadership is earned through service. You take care of your people, and they take care of the mission.",
  "Running taught me patience. You don't run a marathon on race day. You build toward it week by week, track your progress honestly, and trust the work.",
  "I try to bring that same discipline to team-building. Small improvements add up. So does trust.",
  "Outside of work, I play guitar, am learning mandolin, read when I can, and watch a lot of movies. Magnolia is my favorite. I live in Northeast Ohio with my family, and we spend a lot of time on hikes, at amusement parks, and finding small adventures close to home."
] satisfies readonly string[];

export const aboutClosingCtas = [
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
] satisfies readonly AboutCta[];
