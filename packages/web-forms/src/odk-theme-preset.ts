import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const odkThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef8fb',
      100: '#d5eef5',
      200: '#abdcea',
      300: '#75c3da',
      400: '#3aa5c5',
      500: '#1592b6',
      600: '#0a80a3',
      700: '#086c8a',
      800: '#075a73',
      900: '#064a5e',
      950: '#03303d',
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
            primary: {
              background: '{primary.600}',
              hoverBackground: '{primary.700}',
              activeBackground: '{primary.800}',
            },
            secondary: {
              color: '{surface.950}',
              background: '{surface.0}',
              hoverBackground: '{surface.200}',
            },
          },
          outlined: {
            contrast: {
              color: '{surface.700}',
              hoverBackground: '{surface.200}',
            },
          },
          text: {
            contrast: {
              color: '{surface.700}',
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
