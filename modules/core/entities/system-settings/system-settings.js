
'use strict';

import { loopar, BaseDocument } from 'loopar';
import fs from 'fs'
import { generateThemeCSS } from './tools.js';

export default class SystemSettings extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save();
    await this.setTheme();

    await loopar.build();
  }

  async onLoad() {
    await super.onLoad();
  }

  readCSS() {
    return fs.readFileSync(loopar.makePath(loopar.pathRoot, 'app', 'src', 'styles', 'main.css'), 'utf8');
  }

  async setTheme() {
    const darkBackground = loopar.utils.isJSON(this.dark_background) ? JSON.parse(this.dark_background) : { color: '#000000', alpha: 1 };
    const theme = generateThemeCSS(darkBackground.color, this.theme || 'blue');
    const css = this.replaceCSSContent(this.readCSS(), theme);
    fs.writeFileSync(loopar.makePath(loopar.pathRoot, 'app', 'src', 'styles', 'main.css'), css, 'utf8');
  }

  replaceCSSContent(input, newContent) {
    return input.replace(/\/\* CSSBegin \*\/[\s\S]*?\/\* CSSEnd \*\//, `/* CSSBegin */\n${newContent}\n/* CSSEnd */`);
  }
}