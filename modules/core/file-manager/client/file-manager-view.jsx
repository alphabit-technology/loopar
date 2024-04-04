
'use strict';

import ViewContext from '@context/view-context';
import { FileBrowser } from '@file-browser';

export default class FileManagerView extends ViewContext {
  has_header = false;
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <FileBrowser
        hasTitle={true}
        files={this.props.meta.rows}
      />
    )
  }
}