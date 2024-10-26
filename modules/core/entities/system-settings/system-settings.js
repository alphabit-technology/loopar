
'use strict';

import { loopar, BaseDocument } from 'loopar';
import fs, { access, mkdir } from 'fs'

const shadcnCssHeader = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

const shadcnCssFooter = `@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}`;

export default class SystemSettings extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save();
    await this.setShadcnCss();

    await loopar.build();
  }

  async onLoad() {
    await super.onLoad();

    await this.readShadcnCss();
    //this.shadcn_css = "test value"// await loopar.getSetting('shadcn_css');
  }

  async readShadcnCss() {
    if(!this.shadcn_css || this.shadcn_css.length <= 0) {
      const shadcn_css = fs.readFileSync(loopar.makePath(loopar.pathRoot, 'src', 'app', 'styles', 'globals.css'), 'utf8');

      this.shadcn_css = shadcn_css.replace(shadcnCssHeader, '').replace(shadcnCssFooter, '');
    }
  }

  async setShadcnCss() {
    if(!this.shadcn_css || this.shadcn_css.length <= 0) return;
    const dark_background = loopar.utils.isJSON(this.dark_background) ? JSON.parse(this.dark_background) : {color: '#000000', alpha: 1};
    const shadcn_css = `${shadcnCssHeader}${this.shadcn_css}${shadcnCssFooter}`
    .replace(/(\.dark\s*{[^}]*--background:\s*)[^;]+(;)/, `$1${this.hexToHsl(dark_background.color, dark_background.alpha)}$2`);


    fs.writeFileSync(loopar.makePath(loopar.pathRoot, 'src','app','styles', 'globals.css'), shadcn_css, 'utf8');
  }

  hexToHsl(hex, alpha = 1) {
    // Convert hex to RGB first
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}% / ${Math.round(alpha * 100)}%`;
  }
}