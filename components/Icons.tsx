"use client";

type IconProps = { className?: string };

type SvgProps = IconProps & { children: React.ReactNode };

function Icon({ className, children }: SvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) { return <Icon {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>; }
export function CampaignsIcon(props: IconProps) { return <Icon {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h6" /></Icon>; }
export function ContactsIcon(props: IconProps) { return <Icon {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>; }
export function TemplatesIcon(props: IconProps) { return <Icon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h8M8 9h2" /></Icon>; }
export function AnalyticsIcon(props: IconProps) { return <Icon {...props}><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></Icon>; }
export function SettingsIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15.0a1.7 1.7 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87L4.2 7.07A2 2 0 1 1 7.03 4.24l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.62.84 1.03 1.51 1.03H21a2 2 0 1 1 0 4h-.09c-.67 0-1.27.4-1.51.97Z" /></Icon>; }
export function HelpIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M9.4 9a2.7 2.7 0 1 1 4.9 1.6c-.9 1.1-2.3 1.4-2.3 3" /><path d="M12 17h.01" /></Icon>; }
export function SignOutIcon(props: IconProps) { return <Icon {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>; }
export function ChevronLeftIcon(props: IconProps) { return <Icon {...props}><polyline points="15 18 9 12 15 6" /></Icon>; }
export function ChevronRightIcon(props: IconProps) { return <Icon {...props}><polyline points="9 18 15 12 9 6" /></Icon>; }
export function LogoIcon(props: IconProps) { return <Icon {...props}><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" /><path d="m3 12 9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" /></Icon>; }
export function MenuIcon(props: IconProps) { return <Icon {...props}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>; }
export function ActivityIcon(props: IconProps) { return <Icon {...props}><path d="M3 12h4l2-7 4 14 2-7h6" /></Icon>; }
export function CheckCircleIcon(props: IconProps) { return <Icon {...props}><path d="m8 12 3 3 5-6" /><circle cx="12" cy="12" r="9" /></Icon>; }
export function ClockIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>; }
export function DownloadIcon(props: IconProps) { return <Icon {...props}><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></Icon>; }
export function FileTextIcon(props: IconProps) { return <Icon {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 3v4h4M8 12h8M8 16h6" /></Icon>; }
export function MailIcon(props: IconProps) { return <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>; }
export function PlusIcon(props: IconProps) { return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>; }
export function SendIcon(props: IconProps) { return <Icon {...props}><path d="m21 3-7 18-4-8-8-4zM21 3 10 13" /></Icon>; }
export function UsersIcon(props: IconProps) { return <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>; }
