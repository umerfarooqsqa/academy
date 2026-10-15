// Inline SVG icons for the public website (2026-10-15 redesign) — simple
// 24px stroke icons, no icon library dependency. Each takes a className
// (size/colour) and inherits currentColor.

type P = { className?: string };

function Svg({ className = "h-6 w-6", children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const UsersIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2.1.6 3.5 2.4 3.5 5.2" />
  </Svg>
);
export const CalendarIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <path d="m8.5 14.5 2 2 4.5-4.5" />
  </Svg>
);
export const PointerIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4 16.5a1.6 1.6 0 0 1 2.4-2.1L9 17" />
  </Svg>
);
export const RocketIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 4c3-1.5 6-1 6-1s.5 3-1 6l-6.5 6.5-5-5L14 4Z" />
    <path d="M7.5 10.5 4 10l3-4 4 .5M13.5 16.5 14 20l4-3-.5-4" />
    <path d="M7 17c-1.5.5-2.5 2-3 4 2-.5 3.5-1.5 4-3" />
  </Svg>
);
export const BookIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    <path d="M8 7.5h8" />
  </Svg>
);
export const GlobeIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </Svg>
);
export const FlaskIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 3h6M10 3v6.5L4.6 18.4A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.4-2.6L14 9.5V3" />
    <path d="M7.3 15h9.4" />
  </Svg>
);
export const CodeIcon = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="4" width="19" height="14" rx="2" />
    <path d="m9.5 9-2.5 2.5L9.5 14M14.5 9l2.5 2.5-2.5 2.5M8 21h8" />
  </Svg>
);
export const SparkIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </Svg>
);
export const CapIcon = (p: P) => (
  <Svg {...p}>
    <path d="m2 9 10-5 10 5-10 5L2 9Z" />
    <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" />
  </Svg>
);
export const ShieldIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m8.8 12 2.2 2.2 4.3-4.4" />
  </Svg>
);
export const PinIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const GiftIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4.2C6 4.8 7 8 12 8Zm0 0s1.5-4.5 4-3.8C18 4.8 17 8 12 8Z" />
  </Svg>
);
export const HomeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9v11.5h13V9M10 20.5v-6h4v6" />
  </Svg>
);
export const MonitorIcon = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </Svg>
);
export const ClockIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
export const ListIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
  </Svg>
);
export const StarIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 20 20" aria-hidden className={`${className} fill-current`}>
    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5Z" />
  </svg>
);
export const CheckIcon = ({ className = "h-3.5 w-3.5" }: P) => (
  <svg viewBox="0 0 20 20" aria-hidden className={`${className} fill-current`}>
    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
  </svg>
);
export const BadgeCheckIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 20 20" aria-hidden className={`${className} fill-current`}>
    <path d="M10 1 12.4 2.7l2.9-.2.9 2.8 2.4 1.7-1 2.8 1 2.8-2.4 1.7-.9 2.8-2.9-.2L10 19l-2.4-1.7-2.9.2-.9-2.8-2.4-1.7 1-2.8-1-2.8 2.4-1.7.9-2.8 2.9.2L10 1Zm3.7 6.3a.9.9 0 0 0-1.3 0L9 10.7 7.6 9.3a.9.9 0 1 0-1.3 1.3l2 2a.9.9 0 0 0 1.3 0l4-4a.9.9 0 0 0 0-1.3Z" />
  </svg>
);
export const PhoneIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 3.5h3l1.5 4.5-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7a2 2 0 0 1 2-2.2Z" />
  </Svg>
);
export const MailIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6 8.5 7 8.5-7" />
  </Svg>
);
export const BriefcaseIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18" />
  </Svg>
);
export const ArrowRightIcon = ({ className = "h-4 w-4" }: P) => (
  <Svg className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ChevronDownIcon = ({ className = "h-5 w-5" }: P) => (
  <Svg className={className}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const FacebookFIcon = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden className={`${className} fill-current`}>
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
  </svg>
);
