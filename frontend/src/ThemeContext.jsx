import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('lifepulse-dashboard-theme') || 'maroon');

  useEffect(() => {
    localStorage.setItem('lifepulse-dashboard-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === 'navy' ? 'maroon' : 'navy');

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
