
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

  async setTheme() {
    const darkBackground = loopar.utils.objToRGBA(loopar.utils.JSONparse(this.dark_background));
    const theme = generateThemeCSS(darkBackground, this.theme || 'blue', this.include_titles);
    fs.writeFileSync(loopar.makePath(loopar.pathRoot, 'config', 'tailwind.css'), theme, 'utf8');
  }

  replaceCSSContent(input, newContent) {
    return input.replace(/\/\* CSSBegin \*\/[\s\S]*?\/\* CSSEnd \*\//, `/* CSSBegin */\n${newContent}\n/* CSSEnd */`);
  }
}