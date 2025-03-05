import React, { createContext, useContext, useState, useEffect } from 'react';

interface DisplaySettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSettings: (newSettings: Partial<DisplaySettings>) => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>({
    theme: 'light',
    fontSize: 'medium',
  });

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('displaySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const applySettings = (newSettings: Partial<DisplaySettings>) => {
    // Apply theme
    if (newSettings.theme) {
      document.documentElement.setAttribute('data-theme', newSettings.theme);
      // Also update body background and text color for dark mode
      if (newSettings.theme === 'dark') {
        document.body.style.backgroundColor = '#1A202C';
        document.body.style.color = '#FFFFFF';
      } else {
        document.body.style.backgroundColor = '#FFFFFF';
        document.body.style.color = '#000000';
      }
    }

    // Apply font size
    if (newSettings.fontSize) {
      document.documentElement.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px'
      }[newSettings.fontSize];
    }
  };

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    applySettings(newSettings);
  };

  return (
    <DisplaySettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (context === undefined) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
} 