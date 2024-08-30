
'use strict';

import { loopar, BaseController } from "loopar";

export default class DeskController extends BaseController {
    constructor(props) {
        super(props);
    }

    async actionSidebar() {
        return await super.render({
            sidebarData: loopar.modulesGroup
        });
    }
}