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

export type StructuredIdentityMetadata = {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  url: string;
  jobTitle: string;
  description: string;
  sameAs: readonly string[];
};

export const siteUrl = "https://stevenbyington.me";
export const siteName = "Steven Byington";
export const resumePdfRoute = "/resume/steven-byington-resume.pdf";

export function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteUrl).href;
}

export const siteMetadata = {
  name: siteName,
  siteName,
  siteUrl,
  titleTemplate: "%s | Steven Byington",
  description:
    "A personal portfolio focused on resume, experience, selected projects, and clear contact paths.",
  author: "Steven Byington",
  locale: "en_US",
  defaultOpenGraphImage: brandAssets.openGraph.path,
  defaultOpenGraphImageAlt: "Steven Byington social preview",
  toAbsoluteUrl
} as const;

export const launchRoutes = [
  "/",
  "/experience/",
  "/projects/",
  "/projects/aeris/",
  "/projects/soilos/",
  "/resume/",
  "/contact/"
] as const;

export const sitemapRoutes = [...launchRoutes, resumePdfRoute] as const;

export const structuredIdentityMetadata = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteName,
  url: siteUrl,
  jobTitle: "Software Engineering Manager",
  description:
    "Software Engineering Manager with full-stack depth, product-minded leadership, and a USMC leadership foundation.",
  sameAs: [contactLinks.linkedIn.href, contactLinks.github.href]
} satisfies StructuredIdentityMetadata;

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
