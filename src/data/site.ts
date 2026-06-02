export type LaunchNavigationItem = {
  label: string;
  href: string;
  isHighlighted?: boolean;
};

export type FooterLink = {
  label: string;
  href: string;
};

export const siteMetadata = {
  name: "Steven Byington",
  titleTemplate: "%s | Steven Byington",
  description:
    "A personal portfolio focused on resume, experience, selected projects, and clear contact paths.",
  author: "Steven Byington",
  locale: "en_US"
} as const;

export const launchNavigation = [
  { label: "Home", href: "/" },
  { label: "Experience", href: "/experience/" },
  { label: "Projects", href: "/projects/" },
  { label: "Resume", href: "/resume/", isHighlighted: true },
  { label: "Contact", href: "/contact/" }
] satisfies readonly LaunchNavigationItem[];

export const footerLinks = [
  { label: "Email", href: "mailto:hello@stevenbyington.com" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/stevenbyington/" },
  { label: "GitHub", href: "https://github.com/srbying" },
  { label: "Resume PDF", href: "/resume.pdf" }
] satisfies readonly FooterLink[];
