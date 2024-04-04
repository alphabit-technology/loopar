
'use strict';

import { BaseController, loopar } from 'loopar';

export default class DocumentHistoryController extends BaseController {
    constructor(props) {
        super(props);
    }

    async actionHistory() {
        if (this.hasData()) {
            await loopar.session.set(this.document + '_page', this.page || 1);
        }

        const list = await loopar.getList(this.document, {
            filters: {
                "=": {
                    document: this.documentName,
                    document_id: this.documentId
                }
            },
        });

        return this.render(list);
    }

    async actionRestore() {
        const ref = await loopar.getDocument(this.document, this.documentName);

        return this.success(await ref.restore());
    }
}