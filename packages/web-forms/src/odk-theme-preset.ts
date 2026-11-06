import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { ODK } from './odk-design-system';

export const odkThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: ODK.blue100,
      100: ODK.blue200,
      200: ODK.blue300,
      300: ODK.blue400,
      400: ODK.blue500,
      500: ODK.blue600,
      600: ODK.blue700,
      700: ODK.blue800,
      800: ODK.blue900,
      900: ODK.blue950,
      950: ODK.blue950,
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
