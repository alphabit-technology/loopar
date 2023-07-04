
'use strict';

import ViewContext from '/gui/document/view-context.js';
import { FileBrowser } from '/components/tools/file-browser.js';

export default class FileManagerView extends ViewContext {
    has_header = false;
    constructor(props) {
        super(props);
    }

    render() {
        //return super.render([
        return FileBrowser({
                has_title: true,
                files: this.props.meta.rows,
            })
        //]);
    }
}