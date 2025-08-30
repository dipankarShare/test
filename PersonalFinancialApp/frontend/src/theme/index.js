// Modern Financial App Theme - Inspired by enterprise design systems
export const theme = {
  // Color Palette - Modern, professional colors
  colors: {
    // Primary brand colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe', 
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main brand color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Neutral grays - Clean, modern
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    
    // Light theme colors
    light: {
      bg: '#fefcf7',        // Main background (cream)
      surface: '#fffef9',   // Card/panel background (light cream)
      elevated: '#faf8f1',  // Elevated surfaces (slightly darker cream)
      border: '#e8e5dc',    // Borders and dividers (cream border)
      text: {
        primary: '#2d2a24',   // Main text (dark brown)
        secondary: '#4a453d', // Secondary text (medium brown)
        muted: '#6b6558',     // Muted text (light brown)
      }
    },
    
    // Semantic colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    }
  },
  
  // Typography - Clean, readable fonts
  typography: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },
  
  // Spacing - Consistent spacing scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // Border radius - Modern, subtle curves
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  // Shadows - Subtle, modern elevation
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Component-specific styles
  components: {
    card: {
      background: '#fffef9',
      border: '1px solid #e8e5dc',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    
    button: {
      primary: {
        background: '#0ea5e9',
        backgroundHover: '#0284c7',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 500,
      },
      secondary: {
        background: '#334155',
        backgroundHover: '#475569',
        color: '#f8fafc',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 500,
      },
      success: {
        background: '#22c55e',
        backgroundHover: '#16a34a',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 500,
      },
      danger: {
        background: '#ef4444',
        backgroundHover: '#dc2626',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 500,
      }
    },
    
    input: {
      background: '#fffef9',
      border: '1px solid #d4d0c4',
      borderFocus: '1px solid #0ea5e9',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      color: '#2d2a24',
      placeholder: '#6b6558',
    },
    
    table: {
      background: '#fffef9',
      headerBackground: '#e8e5dc',
      borderColor: '#d4d0c4',
      stripedBackground: '#fdfcf6',
      hoverBackground: '#f7f4ed',
    }
  },
  
  // Layout
  layout: {
    sidebar: {
      width: '280px',
      background: '#faf8f1',
      border: '1px solid #e8e5dc',
    },
    header: {
      height: '64px',
      background: '#fffef9',
      border: '1px solid #e8e5dc',
    },
    container: {
      maxWidth: '1200px',
      padding: '2rem',
    }
  },
  
  // Transitions - Smooth, professional animations
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  }
};

// Utility functions for theme usage
export const getColor = (colorPath) => {
  const keys = colorPath.split('.');
  let value = theme.colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return colorPath; // Return original if path not found
  }
  
  return value;
};

export const getSpacing = (size) => theme.spacing[size] || size;
export const getBorderRadius = (size) => theme.borderRadius[size] || size;
export const getShadow = (size) => theme.shadows[size] || size;

export default theme;