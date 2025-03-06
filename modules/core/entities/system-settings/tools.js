import { themes } from 'loopar';
import chroma from 'chroma-js';

/**
 * Generates a CSS string with theme variables for light and dark modes.
 * @param {string} dark_background_color - Background color for dark mode.
 * @param {string} themeName - Name of the theme for the base text color (red, green, blue, yellow, purple, zinc, orange, gray, slate).
 * @returns {string} CSS string with the generated styles.
 */

export function generateThemeCSS(dark_background_color, themeName, includeTitles=true) {
  // Mapping of theme names to base colors (inspired by Tailwind)
  const themeColors = themes.map(theme => theme.color).reduce((acc, color, index) => {
    acc[themes[index].name] = color;
    return acc;
  }, {});
  // Get the base color for the theme or default to blue if not found
  const baseTextHex = themeColors[themeName] || themeColors.blue;

  // --- Light Mode ---
  // Fixed white background for light mode
  const themeBackground = chroma('white');
  // Use the base color derived from the theme name for text
  let themeText = chroma(baseTextHex);
  // Ensure sufficient contrast with the background; fallback to black if needed
  if (chroma.contrast(themeText, themeBackground) < 4.5) {
    themeText = chroma('black');
  }
  // Cards are defined as a slightly darkened version of the background
  const themeCard = themeBackground.darken(0.1);

  // --- Dark Mode ---
  // Dark background is provided via parameter
  const darkBackground = chroma(dark_background_color);
  // Derive text color from the base color
  let darkText = chroma(baseTextHex);
  // For specific themes (gray and slate), force white text for better contrast
  if (['gray', 'slate'].includes(themeName)) {
    darkText = chroma('white');
  } else if (chroma.contrast(darkText, darkBackground) < 4.5) {
    darkText = chroma('white');
  }
  // Cards in dark mode are a slightly darkened version of the background
  const darkCard = darkBackground.darken(0.1);

  // --- Derive primary color from the base text color ---
  // In light mode, increase saturation and brighten slightly for emphasis
  const themePrimary = themeText.saturate(0.5).brighten(0.2);
  const themePrimaryForeground = chroma.contrast(themePrimary, 'white') >= 4.5 ? chroma('white') : chroma('black');

  // In dark mode, apply similar transformation but darken slightly
  const darkPrimary = darkText.saturate(0.5).darken(0.2);
  const darkPrimaryForeground = chroma.contrast(darkPrimary, 'white') >= 4.5 ? chroma('white') : chroma('black');

  // Secondary color uses a +30° hue shift from primary
  const themeSecondaryHue = (themePrimary.get('hsl.h') + 30) % 360;
  const themeSecondary = chroma.hsl(themeSecondaryHue, 0.048, 0.959);
  const themeSecondaryForeground = themeText;

  const darkSecondaryHue = (darkPrimary.get('hsl.h') + 30) % 360;
  const darkSecondary = chroma.hsl(darkSecondaryHue, 0.065, 0.151);
  const darkSecondaryForeground = darkText;

  // Muted and accent colors are similar to secondary
  const themeMuted = themeSecondary;
  const themeMutedForeground = chroma.hsl(25, 0.053, 0.447);
  const themeAccent = themeSecondary;
  const themeAccentForeground = themeSecondaryForeground;

  const darkMuted = darkSecondary;
  const darkMutedForeground = chroma.hsl(24, 0.054, 0.639);
  const darkAccent = darkSecondary;
  const darkAccentForeground = darkSecondaryForeground;

  // Colors for destructive actions
  const themeDestructive = chroma.hsl(0, 0.842, 0.602);
  const themeDestructiveForeground = chroma('white');

  const darkDestructive = chroma.hsl(0, 0.722, 0.506);
  const darkDestructiveForeground = chroma('white');

  // Borders and inputs are differentiated for each mode
  const themeBorder = chroma.hsl(20, 0.059, 0.90);
  const themeInput = themeBorder;
  const darkBorder = chroma.hsl(12, 0.065, 0.151);
  const darkInput = darkBorder;

  // Ring color is based on primary
  const themeRing = themePrimary;
  const darkRing = darkPrimary;

  // Helper function to format color in HSL with "h s% l%" format
  function toHSLString(color) {
    let h = color.get('hsl.h');
    // If h is NaN (e.g., for desaturated colors), set it to 0
    if (isNaN(h)) {
      h = 0;
    }
    h = h.toFixed(1);
    const s = (color.get('hsl.s') * 100).toFixed(1);
    const l = (color.get('hsl.l') * 100).toFixed(1);
    return `${h} ${s}% ${l}%`;
  }

  const titleApply = includeTitles ? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((selector, index) => {
      return `${selector} {@apply text-foreground/${95 - index * 10};}`;
    }).join('\n') : '';

  // Build the CSS string with the calculated values
  const css = `
@theme {
  --background: ${toHSLString(themeBackground)};
  --foreground: ${toHSLString(themeText)};
  --card: ${toHSLString(themeCard)};
  --card-foreground: ${toHSLString(themeText)};
  --popover: ${toHSLString(themeBackground)};
  --popover-foreground: ${toHSLString(themeText)};
  --primary: ${toHSLString(themePrimary)};
  --primary-foreground: ${toHSLString(themePrimaryForeground)};
  --secondary: ${toHSLString(themeSecondary)};
  --secondary-foreground: ${toHSLString(themeSecondaryForeground)};
  --muted: ${toHSLString(themeMuted)};
  --muted-foreground: ${toHSLString(themeMutedForeground)};
  --accent: ${toHSLString(themeAccent)};
  --accent-foreground: ${toHSLString(themeAccentForeground)};
  --destructive: ${toHSLString(themeDestructive)};
  --destructive-foreground: ${toHSLString(themeDestructiveForeground)};
  --border: ${toHSLString(themeBorder)};
  --input: ${toHSLString(themeInput)};
  --ring: ${toHSLString(themeRing)};
  --radius: 0.5rem;
}

.dark {
  --background: ${toHSLString(darkBackground)};
  --foreground: ${toHSLString(darkText)};
  --card: ${toHSLString(darkCard)};
  --card-foreground: ${toHSLString(darkText)};
  --popover: ${toHSLString(darkBackground)};
  --popover-foreground: ${toHSLString(darkText)};
  --primary: ${toHSLString(darkPrimary)};
  --primary-foreground: ${toHSLString(darkPrimaryForeground)};
  --secondary: ${toHSLString(darkSecondary)};
  --secondary-foreground: ${toHSLString(darkSecondaryForeground)};
  --muted: ${toHSLString(darkMuted)};
  --muted-foreground: ${toHSLString(darkMutedForeground)};
  --accent: ${toHSLString(darkAccent)};
  --accent-foreground: ${toHSLString(darkAccentForeground)};
  --destructive: ${toHSLString(darkDestructive)};
  --destructive-foreground: ${toHSLString(darkDestructiveForeground)};
  --border: ${toHSLString(darkBorder)};
  --input: ${toHSLString(darkInput)};
  --ring: ${toHSLString(darkRing)};
}
${titleApply}
`;
return css;
}