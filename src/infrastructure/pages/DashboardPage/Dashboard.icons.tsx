/**
 * Dashboard.icons.tsx
 *
 * Custom SVG icon set for the Suksai CRM dashboard.
 * All icons follow the Phosphor light-stroke aesthetic (1.5px stroke, round caps/joins).
 * No external icon library — zero dependency constraint.
 */

interface IIconProps {
  readonly size?: number;
}

const Icon = ({
  path,
  size = 18,
  viewBox = '0 0 18 18',
}: {
  path: string;
  size?: number;
  viewBox?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d={path}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Suksai nav icons (Phosphor-style approximations) ──────────────────────

const SquaresFour = ({ size }: IIconProps = {}) => (
  <Icon path="M2.5 2.5h5v5h-5zM10.5 2.5h5v5h-5zM2.5 10.5h5v5h-5zM10.5 10.5h5v5h-5z" size={size} />
);

const CalendarBlank = ({ size }: IIconProps = {}) => (
  <Icon
    path="M3 3.5h12a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM2 7.5h14M6 2v3M12 2v3"
    size={size}
  />
);

const UsersThree = ({ size }: IIconProps = {}) => (
  <Icon
    path="M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 16c0-3.314 3.134-6 7-6s7 2.686 7 6M1 13c.9-2 2.8-3.4 5-3.8M17 13c-.9-2-2.8-3.4-5-3.8"
    size={size}
  />
);

const FlowerLotus = ({ size }: IIconProps = {}) => (
  <Icon
    path="M9 15c0 0-5-3-5-8 0 0 2.5 1 5 4 2.5-3 5-4 5-4 0 5-5 8-5 8zM9 15c0-6 0-9 0-12M4 7C2.5 5.5 2 3 2 3s2.5.5 4 2M14 7c1.5-1.5 2-4 2-4s-2.5.5-4 2"
    size={size}
  />
);

const HandHeart = ({ size }: IIconProps = {}) => (
  <Icon
    path="M2 10.5c0 0 .5-3 3.5-3h3.5l2 .5L13 9c1 .5 1.5 1.5.5 2.5L9 13H2V10.5zM9 13l5-5c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8L11 17M6 5.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0"
    size={size}
  />
);

const Receipt = ({ size }: IIconProps = {}) => (
  <Icon
    path="M3 2h12v14l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V2zM6 6.5h6M6 9.5h6M6 12.5h3"
    size={size}
  />
);

const ChartLine = ({ size }: IIconProps = {}) => (
  <Icon path="M2 13.5l4-5 3 3 3.5-5 3.5 4M2 15.5h14" size={size} />
);

const GearSix = ({ size }: IIconProps = {}) => (
  <Icon
    path="M9 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 9l-1.2-.4a5.8 5.8 0 0 0-.5-1.2l.6-1.1-1.2-1.2-1.1.6a5.8 5.8 0 0 0-1.2-.5L10 4H8l-.4 1.2a5.8 5.8 0 0 0-1.2.5l-1.1-.6-1.2 1.2.6 1.1a5.8 5.8 0 0 0-.5 1.2L3 9l1.2.4c.1.4.3.8.5 1.2l-.6 1.1 1.2 1.2 1.1-.6c.4.2.8.4 1.2.5L8 14h2l.4-1.2c.4-.1.8-.3 1.2-.5l1.1.6 1.2-1.2-.6-1.1c.2-.4.4-.8.5-1.2L15 9z"
    size={size}
  />
);

const Buildings = ({ size }: IIconProps = {}) => (
  <Icon
    path="M2 14V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v8M10 9h4a1 1 0 0 1 1 1v4M2 14h14M5 8h2M5 11h2M11 12h2M7 14v-2"
    size={size}
    viewBox="0 0 18 18"
  />
);

// ─── Header action icons ────────────────────────────────────────────────────

export const IcoHouse = ({ size }: IIconProps = {}) => (
  <Icon path="M2.5 8L9 2.5l6.5 5.5V16H11v-4.5H7V16H2.5V8z" size={size ?? 16} />
);

export const IcoQuestion = ({ size }: IIconProps = {}) => (
  <Icon
    path="M6.5 6.5c0-1.4 1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1-1.5 2-1.5 3.5M9 14v.5"
    size={size ?? 18}
  />
);

export const IcoCaretDown = ({ size }: IIconProps = {}) => (
  <Icon path="M5 7.5l4 4 4-4" size={size ?? 14} />
);

// Lotus sun: 8 petal-shaped rays around a circle — shown when dark mode is active
export const IcoLotusSun = ({ size }: IIconProps = {}) => (
  <svg
    width={size ?? 18}
    height={size ?? 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="3" />
    {([0, 45, 90, 135, 180, 225, 270, 315] as const).map((deg) => (
      <path
        key={deg}
        d="M12 9C12.8 7.5 12.8 5.5 12 4C11.2 5.5 11.2 7.5 12 9Z"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
  </svg>
);

// Crescent moon — shown when light mode is active
export const IcoCrescentMoon = ({ size }: IIconProps = {}) => (
  <svg
    width={size ?? 18}
    height={size ?? 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
  </svg>
);

// ─── Grouped nav icons (sidebar groups) ────────────────────────────────────

export const Icons = {
  // Estudio
  squaresFour: <SquaresFour />,
  calendarBlank: <CalendarBlank />,
  usersThree: <UsersThree />,
  flowerLotus: <FlowerLotus />,
  handHeart: <HandHeart />,
  buildings: <Buildings />,
  // Operaciones
  receipt: <Receipt />,
  chartLine: <ChartLine />,
  gearSix: <GearSix />,

  // Legacy icons (kept for backward compatibility)
  overview: <Icon path="M2 2h6v6H2zM10 2h6v6h-6zM2 10h6v6H2zM10 10h6v6h-6z" />,
  colors: <Icon path="M9 2a7 7 0 100 14A7 7 0 009 2zm0 2v10M5 5.5l8 7M5 12.5l8-7" />,
  typography: <Icon path="M3 4h12M9 4v10M5 14h8" />,
  spacing: <Icon path="M2 9h14M5 5l-3 4 3 4M13 5l3 4-3 4" />,
  layout: <Icon path="M2 2h14v3H2zM2 7h4v9H2zM8 7h8v4H8zM8 13h8v3H8z" />,
  buttons: <Icon path="M3 6h12v6H3z" />,
  cards: <Icon path="M2 3h14v12H2zM2 7h14" />,
  modals: <Icon path="M4 2h10v2H4zM2 4h14v12H2zM6 9h6" />,
  avatars: <Icon path="M9 9a3 3 0 100-6 3 3 0 000 6zM3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" />,
  popovers: <Icon path="M3 3h10v8H3zM8 11v3M6 14h4" />,
  sidebar: <Icon path="M2 2h4v14H2zM8 6h8M8 9h8M8 12h6" />,
  borders: <Icon path="M2 2h14v14H2z" />,
  shadows: <Icon path="M4 4h10v10H4zM7 16h8v-8" />,
  form: <Icon path="M3 5h12M3 9h8M3 13h6M13 11v6M10 14h6" />,
  navbar: <Icon path="M1 4h16M1 4v10h16V4M5 8h2M9 8h6" />,
  breadcrumb: <Icon path="M2 9h3l2-4 3 8 2-4h4" />,
  themetoggle: (
    <Icon path="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M6 10a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
  ),
  radio: <Icon path="M9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 9m-5 0a5 5 0 1 0 10 0 5 5 0 0 0-10 0" />,
  checkbox: <Icon path="M3 9l3 3 5-5M2 3h14v14H2z" />,
  table: <Icon path="M1.5 4.5h15v11h-15zM1.5 8h15M6 8v7.5M6 4.5v3.5" />,
  toast: <Icon path="M2 4h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-4 3V5a1 1 0 0 1 1-1z" />,
  tabs: <Icon path="M1.5 4.5h15v11h-15zM1.5 9h15M5.5 4.5v4.5M10.5 4.5v4.5" />,
  steps: (
    <Icon path="M3 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 7h2M11 7h2" />
  ),
  switch_: <Icon path="M2 8h4a4 4 0 0 0 0-8H2zM10 0h4a4 4 0 0 1 0 8H10zM14 4h.01" />,
  icons: <Icon path="M3 3h.01M7 3h.01M11 3h.01M3 7h.01M7 7h.01M11 7h.01M7 11h6M7 15h4M10 11v4" />,
  datepicker: (
    <Icon path="M5 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 9h14M8 2v4M12 2v4" />
  ),
};
