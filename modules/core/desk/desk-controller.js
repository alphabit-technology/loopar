
'use strict';

import {BaseController} from 'loopar-env';
import {loopar} from "../../../../../loopar-env/index.js";

export default class DeskController extends BaseController {
    constructor(props){
        super(props);
    }

    async action_sidebar(){
        return await super.render({
            sidebarData: loopar.modules_group
        });
    }
}