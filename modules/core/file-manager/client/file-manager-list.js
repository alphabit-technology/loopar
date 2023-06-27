'use strict';

import ListContext from '/gui/document/list-context.js';
import {FileBrowser} from '/components/tools/file-browser.js';

export default class FileManagerList extends ListContext {
   has_header = false;
   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         FileBrowser({
            has_title: true,
            files: this.props.meta.rows,
         })
      ]);
   }
}