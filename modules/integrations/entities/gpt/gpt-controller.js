
'use strict';

import { SingleController, loopar } from 'loopar';

export default class GPTController extends SingleController {
  constructor(props) {
    super(props);
  }

  async actionPrompt() {
    const gpt = await loopar.getDocument("GPT");

    const data = this.data;

    return await gpt.prompt({
      prompt: this.prompt,
      document_type: this.document_type
    });
  }
}