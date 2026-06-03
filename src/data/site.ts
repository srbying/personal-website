import { brandAssets, contactLinks } from "./launchAssets";

export type LaunchNavigationItem = {
  label: string;
  href: string;
  isHighlighted?: boolean;
};

export type FooterLink = {
  label: string;
  href: string;
  isExternal: boolean;
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
  {
    label: "Email",
    href: contactLinks.email.href,
    isExternal: contactLinks.email.isExternal
  },
  {
    label: "LinkedIn",
    href: contactLinks.linkedIn.href,
    isExternal: contactLinks.linkedIn.isExternal
  },
  {
    label: "GitHub",
    href: contactLinks.github.href,
    isExternal: contactLinks.github.isExternal
  },
  {
    label: "Resume PDF",
    href: contactLinks.resumePdf.href,
    isExternal: contactLinks.resumePdf.isExternal
  }
] satisfies readonly FooterLink[];
