import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

// Ícones do mockup (traço 2px, estilo Lucide).
const ICONS = {
  back: <><Path d="m12 19-7-7 7-7" /><Path d="M19 12H5" /></>,
  eye: <><Path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><Circle cx="12" cy="12" r="3" /></>,
  car: <><Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10 16 6.6A2 2 0 0 0 14.4 6H7.2a2 2 0 0 0-1.7 1L3 11v5c0 .6.4 1 1 1h2" /><Circle cx="7" cy="17" r="2" /><Circle cx="17" cy="17" r="2" /><Path d="M9 17h6" /></>,
  home: <><Path d="M3 21V9l9-6 9 6v12" /><Path d="M7 21v-8h10v8" /><Path d="M7 17h10" /></>,
  swap: <><Path d="m17 2 4 4-4 4" /><Path d="M3 11v-1a4 4 0 0 1 4-4h14" /><Path d="m7 22-4-4 4-4" /><Path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
  check: <Path d="M20 6 9 17l-5-5" />,
  user: <><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0 1 16 0" /></>,
  map: <><Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><Circle cx="12" cy="10" r="3" /></>,
  calendar: <><Rect width="18" height="18" x="3" y="4" rx="2" /><Path d="M16 2v4M8 2v4M3 10h18" /></>,
  wallet: <><Path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><Path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>,
  logout: <><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Path d="m16 17 5-5-5-5" /><Path d="M21 12H9" /></>,
  trash: <><Path d="M3 6h18" /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  plus: <Path d="M12 5v14M5 12h14" />,
  chevron: <Path d="m9 18 6-6-6-6" />,
  camera: <><Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><Circle cx="12" cy="13" r="3" /></>,
  grid: <><Rect width="7" height="7" x="3" y="3" rx="1" /><Rect width="7" height="7" x="14" y="3" rx="1" /><Rect width="7" height="7" x="14" y="14" rx="1" /><Rect width="7" height="7" x="3" y="14" rx="1" /></>,
  bolt: <Polygon points="13 2 4 14 11 14 10 22 19 10 12 10 13 2" />,
  close: <Path d="M18 6 6 18M6 6l12 12" />,
  info: <><Circle cx="12" cy="12" r="10" /><Path d="M12 16v-4M12 8h.01" /></>,
  clock: <><Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" /></>,
  star: <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  locate: <><Circle cx="12" cy="12" r="3" /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><Circle cx="12" cy="12" r="7" /></>,
  heart: <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  share: <><Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" /><Path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></>,
  search: <><Circle cx="11" cy="11" r="8" /><Path d="m21 21-4.3-4.3" /></>,
  sliders: <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  moon: <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  lock: <><Rect width="18" height="11" x="3" y="11" rx="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  card: <><Rect width="20" height="14" x="2" y="5" rx="2" /><Path d="M2 10h20" /></>,
  settings: <><Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><Circle cx="12" cy="12" r="3" /></>,
  file: <><Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><Path d="M14 2v4a2 2 0 0 0 2 2h4M8 13h8M8 17h5" /></>,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color = '#13263A', filled = false, strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; filled?: boolean; strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </Svg>
  );
}
