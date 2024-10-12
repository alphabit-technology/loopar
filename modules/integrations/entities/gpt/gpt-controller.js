
'use strict';

import { SingleController, loopar } from 'loopar';

export default class GPTController extends SingleController {
  constructor(props) {
    super(props);
  }

  async actionPrompt() {
    const gpt = await loopar.getDocument("GPT");

    const data = this.data;
    const r = await gpt.prompt(data);

    return await this.success(r);
  }
}