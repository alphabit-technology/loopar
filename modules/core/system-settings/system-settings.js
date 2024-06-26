
'use strict';

import { loopar, BaseDocument } from 'loopar';


export default class SystemSettings extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save();

    await loopar.makeConfig();
  }
}