
'use strict';

import { CoreInstaller } from 'loopar';

export default class AppManager extends CoreInstaller {
  async clone() {
    return super.clone(this.git_repo);
  }
}