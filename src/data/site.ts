import { brandAssets, contactLinks, resumePdf } from "./launchAssets";

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
  locale: "en_US",
  defaultOpenGraphImage: brandAssets.openGraph.path
} as const;

export const launchNavigation = [
  { label: "Home", href: "/" },
  { label: "Experience", href: "/experience/" },
  { label: "Projects", href: "/projects/" },
  { label: "Resume", href: "/resume/", isHighlighted: true },
  { label: "Contact", href: "/contact/" }
] satisfies readonly LaunchNavigationItem[];

export const footerLinks = [
  { label: "Email", href: contactLinks.email.href },
  { label: "LinkedIn", href: contactLinks.linkedIn.href },
  { label: "GitHub", href: contactLinks.github.href },
  { label: "Resume PDF", href: resumePdf.path }
] satisfies readonly FooterLink[];
