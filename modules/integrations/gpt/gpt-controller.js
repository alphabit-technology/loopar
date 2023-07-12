
'use strict';

import { SingleController, loopar } from 'loopar-env';

export default class GPTController extends SingleController {
    constructor(props) {
        super(props);
    }

    async action_prompt() {
        const gpt = await loopar.get_document("GPT");

        const data = this.data;
        const r = await gpt.prompt(data);

        return await this.success(r);
    }
}