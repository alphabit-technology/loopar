
'use strict';

import { BaseController } from 'loopar';

export default class NotFoundController extends BaseController {
    context = this.workspace;
    free_access = true;
    constructor(props) {
        super(props);
    }
}