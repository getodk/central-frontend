import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const odkThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'var(--odk-blue-100)',
      100: 'var(--odk-blue-200)',
      200: 'var(--odk-blue-300)',
      300: 'var(--odk-blue-400)',
      400: 'var(--odk-blue-500)',
      500: 'var(--odk-blue-600)',
      600: 'var(--odk-blue-700)',
      700: 'var(--odk-blue-800)',
      800: 'var(--odk-blue-900)',
      900: 'var(--odk-blue-950)',
      950: 'var(--odk-blue-950)',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
    },
  },
  components: {
    panel: {
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
          },
          header: {
            color: '{surface.950}',
          },
        },
      },
    },
    card: {
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
          },
        },
      },
    },
    dialog: {
      root: {
        background: 'var(--odk-base-background-color)',
        borderRadius: 'var(--odk-radius)',
      },
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
          },
        },
      },
    },
    menu: {
      colorScheme: {
        light: {
          item: {
            color: '{surface.950}',
            icon: {
              color: '{surface.950}',
            },
          },
        },
      },
    },
    message: {
      colorScheme: {
        light: {
          error: {
            borderColor: '{red.300}',
            color: '{red.600}',
          },
        },
      },
    },
    select: {
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
            paddingY: '12px',
          },
          option: {
            color: '{surface.950}',
          },
          dropdown: {
            color: '{surface.700}',
          },
        },
      },
    },
    multiselect: {
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
            paddingY: '12px',
          },
          option: {
            color: '{surface.950}',
          },
          dropdown: {
            color: '{surface.700}',
          },
        },
      },
    },
    inputtext: {
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
            paddingY: '12px',
          },
        },
      },
    },
    textarea: {
      colorScheme: {
        light: {
          root: {
            color: '{surface.950}',
          },
        },
      },
    },
    button: {
      colorScheme: {
        light: {
          root: {
            secondary: {
              color: '{surface.950}',
              background: '{surface.0}',
              hoverBackground: '{surface.200}',
            },
          },
          outlined: {
            contrast: {
              hoverBackground: '{surface.200}',
            },
          },
          text: {
            contrast: {
              hoverBackground: '{surface.200}',
            },
          },
        },
      },
    },
    colorpicker: {
      colorScheme: {
        light: {
          panel: {
            background: 'var(--odk-base-background-color)',
            borderColor: 'var(--odk-border-color)',
          },
        },
      },
    },
    rating: {
      root: {
        gap: '0.3rem',
      },
      icon: {
        size: '28px',
      },
    },
  },
});
