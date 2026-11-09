// Design base do mockup "Karga APP — Protótipo" (docs/design/mockup/Main.dc.html).
export const theme = {
  colors: {
    accent: '#10B981',
    accentBright: '#34D399',
    navy: '#13263A',
    text: '#13263A',
    textMuted: '#5B6670',
    textLabel: '#3E4B57',
    link: '#047857',
    greenText: '#065F46',
    greenBg: '#ECF8F2',
    fieldBorder: '#D5DCD9',
    divider: '#E3E9E6',
    border: '#E8EDEB',
    screenBg: '#F6F8F7',
    surface: '#F4F7F6',
    white: '#FFFFFF',
    danger: '#B91C1C',
    dangerBorder: '#DC2626',
    mapBg: '#EEF1EC',
    mapLine: '#E2E7E2',
  },
  radius: { field: 14, button: 16, card: 20, cardLarge: 22, chip: 20 },
  font: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
  },
  shadow: {
    primary: {
      shadowColor: '#10B981',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    card: {
      shadowColor: '#13263A',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
} as const;

export type Theme = typeof theme;
