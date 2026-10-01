import React, { createContext, useContext, useState } from 'react';

export type SellerTheme = 'dark' | 'light';

interface SellerThemeContextType {
  theme: SellerTheme;
  isDarkMode: boolean;
  isLightMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: SellerTheme) => void;
}

const SellerThemeContext = createContext<SellerThemeContextType>({
  theme: 'dark',
  isDarkMode: true,
  isLightMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'seller_app_theme';

export const SellerThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<SellerTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.warn('Unable to access localStorage for seller theme:', e);
    }
    return 'dark';
  });

  const setTheme = (newTheme: SellerTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Unable to save seller theme to localStorage:', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme: SellerTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <SellerThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        isLightMode: theme === 'light',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </SellerThemeContext.Provider>
  );
};

export const useSellerTheme = () => useContext(SellerThemeContext);
