
'use strict';

import ViewContext from '@context/view-context';
import { Browser } from '@file-browser';

export default class FileManagerView extends ViewContext {
  has_header = false;
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Browser
        hasTitle={true}
        files={this.props.meta.rows}
      />
    )
  }
}