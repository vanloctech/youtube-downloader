export type ThemeName = 'zinc' | 'ocean' | 'emerald' | 'rose' | 'amber' | 'violet';
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export const themes: Theme[] = [
  {
    name: 'zinc',
    label: 'Zinc',
    colors: {
      light: {
        primary: '240 5.9% 10%',
        primaryForeground: '0 0% 98%',
        accent: '240 4.8% 95.9%',
        accentForeground: '240 5.9% 10%',
      },
      dark: {
        primary: '0 0% 98%',
        primaryForeground: '240 5.9% 10%',
        accent: '240 3.7% 15.9%',
        accentForeground: '0 0% 98%',
      },
    },
  },
  {
    name: 'ocean',
    label: 'Ocean',
    colors: {
      light: {
        primary: '221.2 83.2% 53.3%',
        primaryForeground: '210 40% 98%',
        accent: '214.3 31.8% 91.4%',
        accentForeground: '222.2 47.4% 11.2%',
      },
      dark: {
        primary: '217.2 91.2% 59.8%',
        primaryForeground: '222.2 47.4% 11.2%',
        accent: '217.2 32.6% 17.5%',
        accentForeground: '210 40% 98%',
      },
    },
  },
  {
    name: 'emerald',
    label: 'Emerald',
    colors: {
      light: {
        primary: '160.1 84.1% 39.4%',
        primaryForeground: '355.7 100% 97.3%',
        accent: '152.4 29.4% 89%',
        accentForeground: '155.1 40.7% 14.3%',
      },
      dark: {
        primary: '158.1 64.4% 51.6%',
        primaryForeground: '155.1 40.7% 14.3%',
        accent: '156 23.4% 18.5%',
        accentForeground: '152.4 29.4% 89%',
      },
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    colors: {
      light: {
        primary: '346.8 77.2% 49.8%',
        primaryForeground: '355.7 100% 97.3%',
        accent: '355.7 100% 94.4%',
        accentForeground: '346.8 77.2% 49.8%',
      },
      dark: {
        primary: '346.8 77.2% 49.8%',
        primaryForeground: '355.7 100% 97.3%',
        accent: '345 20% 18%',
        accentForeground: '355.7 100% 94.4%',
      },
    },
  },
  {
    name: 'amber',
    label: 'Amber',
    colors: {
      light: {
        primary: '37.7 92.1% 50.2%',
        primaryForeground: '20.9 91.7% 14.1%',
        accent: '48 96.5% 88.8%',
        accentForeground: '20.9 91.7% 14.1%',
      },
      dark: {
        primary: '37.7 92.1% 50.2%',
        primaryForeground: '20.9 91.7% 14.1%',
        accent: '36 20% 18%',
        accentForeground: '48 96.5% 88.8%',
      },
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    colors: {
      light: {
        primary: '262.1 83.3% 57.8%',
        primaryForeground: '210 40% 98%',
        accent: '269.2 28.6% 91.2%',
        accentForeground: '262.1 50% 20%',
      },
      dark: {
        primary: '263.4 70% 50.4%',
        primaryForeground: '210 40% 98%',
        accent: '263 30% 20%',
        accentForeground: '269.2 28.6% 91.2%',
      },
    },
  },
];

export const getTheme = (name: ThemeName): Theme => {
  return themes.find((t) => t.name === name) || themes[0];
};
