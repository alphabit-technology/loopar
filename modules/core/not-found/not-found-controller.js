
'use strict';

import {BaseController} from 'loopar-env';

export default class NotFoundController extends BaseController {
    context = this.workspace;
    free_access = true;
    constructor(props){
        super(props);
    }
}