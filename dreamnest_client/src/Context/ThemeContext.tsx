import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';


interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}


interface ThemeProviderProps {
  children: ReactNode;
}


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
