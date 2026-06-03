import siteConfig from "./siteConfig.json";

export type ReviewStatus = "approved" | "pending" | "redacted";

export type LaunchAsset = {
  label: string;
  path: string;
  format: string;
  role: string;
  reviewStatus: ReviewStatus;
  reviewNotes: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type PublicLink = {
  label: string;
  href?: string;
  displayText?: string;
  isExternal: boolean;
  isConfirmed: boolean;
  reviewNotes: string;
};

export const reviewDate = "2026-06-02";

export function hasConfirmedHref(
  link: PublicLink
): link is PublicLink & { href: string } {
  return link.isConfirmed && typeof link.href === "string" && link.href.length > 0;
}

export const resumePdf = {
  label: "Steven Byington Resume PDF",
  path: siteConfig.resumePdfRoute,
  format: "pdf",
  role: "standard recruiter handoff artifact",
  reviewStatus: "approved",
  reviewNotes:
    "Standard resume PDF supplied by Steven and copied into the reserved public launch path."
} satisfies LaunchAsset;

export const brandAssets = {
  desktopHeader: {
    label: "Steven Byington horizontal wordmark",
    path: "/assets/brand/steven-byington-wordmark.png",
    format: "png",
    role: "desktop header logo",
    reviewStatus: "approved",
    reviewNotes:
      "User-provided secondary horizontal wordmark cropped from the launch logo sheet.",
    width: 775,
    height: 176
  },
  compactIcon: {
    label: "Steven Byington compact SB icon",
    path: "/assets/brand/sb-icon.png",
    format: "png",
    role: "mobile header icon",
    reviewStatus: "approved",
    reviewNotes:
      "User-provided compact logo mark normalized for mobile header and favicon use.",
    width: 256,
    height: 256
  },
  favicon: {
    label: "Steven Byington favicon",
    path: "/favicon.png",
    format: "png",
    role: "browser icon",
    reviewStatus: "approved",
    reviewNotes: "Favicon uses the compact SB icon from the logo system.",
    width: 96,
    height: 96
  },
  appleTouchIcon: {
    label: "Steven Byington Apple touch icon",
    path: "/assets/brand/apple-touch-icon.png",
    format: "png",
    role: "mobile bookmark icon",
    reviewStatus: "approved",
    reviewNotes: "PNG export generated from the compact SB icon.",
    width: 180,
    height: 180
  },
  logoLockup: {
    label: "Steven Byington primary logo lockup",
    path: "/assets/brand/logo-lockup.png",
    format: "png",
    role: "large brand contexts",
    reviewStatus: "approved",
    reviewNotes: "User-provided primary logo lockup cropped from the launch logo sheet.",
    width: 1120,
    height: 370
  },
  logoLockupCream: {
    label: "Steven Byington primary logo lockup cream crop",
    path: "/assets/brand/logo-lockup-cream.png",
    format: "png",
    role: "Open Graph source dependency",
    reviewStatus: "approved",
    reviewNotes:
      "Cream-background crop used by the editable Open Graph SVG source.",
    width: 1120,
    height: 370
  },
  logoSystem: {
    label: "Steven Byington logo system sheet",
    path: "/assets/brand/logo-system.png",
    format: "png",
    role: "brand asset reference",
    reviewStatus: "approved",
    reviewNotes:
      "Full user-provided brand sheet with primary lockup, secondary wordmark, compact icon, and palette.",
    width: 1448,
    height: 1086
  },
  openGraph: {
    label: "Steven Byington Open Graph image",
    path: "/assets/brand/open-graph.png",
    format: "png",
    role: "social preview",
    reviewStatus: "approved",
    reviewNotes: "PNG social preview generated from the Open Graph SVG source.",
    width: 1200,
    height: 630
  },
  openGraphSource: {
    label: "Steven Byington Open Graph source",
    path: "/assets/brand/open-graph.svg",
    format: "svg",
    role: "social preview source",
    reviewStatus: "approved",
    reviewNotes: "Editable SVG source for the Open Graph PNG export.",
    width: 1200,
    height: 630
  }
} satisfies Record<string, LaunchAsset>;

export const launchHeadAssets = {
  openGraph: {
    image: {
      path: brandAssets.openGraph.path,
      width: brandAssets.openGraph.width,
      height: brandAssets.openGraph.height
    }
  },
  icons: {
    favicon: brandAssets.favicon.path,
    appleTouchIcon: brandAssets.appleTouchIcon.path
  }
} as const;

export const heroLandscape = {
  label: "Hero Landscape",
  path: "/assets/hero/hero-landscape.webp",
  fallbackPath: "/assets/hero/hero-landscape.png",
  format: "webp",
  role: "homepage hero image",
  alt:
    "Empty forest trail opening toward distant mountains in warm evening light.",
  reviewStatus: "approved",
  reviewNotes:
    "Generated for issue #3 with no visible people, animals, buildings, text, or literal logo recreation.",
  width: 1800,
  height: 1013
} as const;

export const contactLinks = {
  email: {
    label: "Email",
    href: "mailto:hello@stevenbyington.com",
    displayText: "hello@stevenbyington.com",
    isExternal: true,
    isConfirmed: true,
    reviewNotes: "Existing launch contact email carried forward into the asset manifest."
  },
  linkedIn: {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/stevenbyington/",
    displayText: "linkedin.com/in/stevenbyington",
    isExternal: true,
    isConfirmed: true,
    reviewNotes: "Public LinkedIn profile URL carried forward into the asset manifest."
  },
  github: {
    label: "GitHub",
    href: "https://github.com/srbying",
    displayText: "github.com/srbying",
    isExternal: true,
    isConfirmed: true,
    reviewNotes: "Public GitHub profile URL confirmed during the issue #3 pass."
  },
  resumePdf: {
    label: "Resume PDF",
    href: resumePdf.path,
    displayText: resumePdf.path,
    isExternal: false,
    isConfirmed: true,
    reviewNotes: resumePdf.reviewNotes
  }
} satisfies Record<string, PublicLink>;

export const projectLinks = {
  aeris: {
    liveApp: {
      label: "Aeris live app",
      href: "https://aeris-lac.vercel.app",
      displayText: "aeris-lac.vercel.app",
      isExternal: true,
      isConfirmed: true,
      reviewNotes: "Public live app link confirmed from the srbying/aeris repository."
    },
    github: {
      label: "Aeris GitHub",
      href: "https://github.com/srbying/aeris",
      displayText: "github.com/srbying/aeris",
      isExternal: true,
      isConfirmed: true,
      reviewNotes: "Repository is public and safe to link at launch."
    }
  },
  soilos: {
    liveApp: {
      label: "Soilos live app",
      href: "https://soil-os.vercel.app",
      displayText: "soil-os.vercel.app",
      isExternal: true,
      isConfirmed: true,
      reviewNotes:
        "Live app redirects to an auth-gated login screen; do not use as a public project CTA at launch."
    },
    github: {
      label: "Soilos GitHub",
      isExternal: false,
      isConfirmed: false,
      reviewNotes:
        "Repository exists but is private, so it must not be linked publicly at launch."
    }
  }
} satisfies Record<string, Record<string, PublicLink>>;

export const projectScreenshots = {
  aeris: [
    {
      label: "Aeris chat response",
      path: "/assets/projects/aeris/chat-response.png",
      format: "png",
      role: "Aeris project screenshot",
      alt: "Aeris chat response explaining pace improvement at similar heart rates.",
      reviewStatus: "approved",
      reviewNotes:
        "User-provided screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Aeris chat loading",
      path: "/assets/projects/aeris/chat-loading.png",
      format: "png",
      role: "Aeris project screenshot",
      alt: "Aeris chat screen reading the run history after a user asks about heart-rate trends.",
      reviewStatus: "approved",
      reviewNotes:
        "User-provided screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Aeris activity history",
      path: "/assets/projects/aeris/activity-history.png",
      format: "png",
      role: "Aeris project screenshot",
      alt: "Aeris activity history screen with recent running metrics.",
      reviewStatus: "approved",
      reviewNotes:
        "Public screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Aeris trend evidence",
      path: "/assets/projects/aeris/trend-evidence.png",
      format: "png",
      role: "Aeris project screenshot",
      alt: "Aeris trend evidence screen for running analytics.",
      reviewStatus: "approved",
      reviewNotes:
        "Public screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Aeris import CSV",
      path: "/assets/projects/aeris/import-csv.png",
      format: "png",
      role: "Aeris project screenshot",
      alt: "Aeris import CSV screen for Garmin activity uploads.",
      reviewStatus: "approved",
      reviewNotes:
        "Public screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    }
  ],
  soilos: [
    {
      label: "Soilos scenario comparison",
      path: "/assets/projects/soilos/scenario-comparison.png",
      format: "png",
      role: "Soilos project screenshot",
      alt: "Soilos three-year scenario comparison dashboard.",
      reviewStatus: "approved",
      reviewNotes:
        "User-provided screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Soilos calculator",
      path: "/assets/projects/soilos/calculator.png",
      format: "png",
      role: "Soilos project screenshot",
      alt: "Soilos product and application-rate calculator screen.",
      reviewStatus: "approved",
      reviewNotes:
        "User-provided screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Soilos calendar task detail",
      path: "/assets/projects/soilos/calendar-task-detail.png",
      format: "png",
      role: "Soilos project screenshot",
      alt: "Soilos calendar task detail sheet for spring compost.",
      reviewStatus: "approved",
      reviewNotes:
        "User-provided screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    },
    {
      label: "Soilos calendar month",
      path: "/assets/projects/soilos/calendar-month.png",
      format: "png",
      role: "Soilos project screenshot",
      alt: "Soilos monthly calendar view with scheduled lawn-care tasks.",
      reviewStatus: "approved",
      reviewNotes:
        "User-provided screenshot reviewed with no addresses, precise locations, API keys, auth details, private notes, or sensitive financial details visible."
    }
  ]
} satisfies Record<string, LaunchAsset[]>;

export const launchAssetChecklist = [
  ...Object.values(brandAssets),
  resumePdf,
  {
    label: heroLandscape.label,
    path: heroLandscape.path,
    format: heroLandscape.format,
    role: heroLandscape.role,
    reviewStatus: heroLandscape.reviewStatus,
    reviewNotes: heroLandscape.reviewNotes,
    width: heroLandscape.width,
    height: heroLandscape.height
  },
  ...projectScreenshots.aeris,
  ...projectScreenshots.soilos
] satisfies LaunchAsset[];
