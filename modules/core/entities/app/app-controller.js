'use strict';

import { loopar, BaseController } from 'loopar';

export default class AppController extends BaseController {
   constructor(props) {
      super(props);
   }

  async actionIncrementPatch() {
    const model = await loopar.getDocument("App", this.name);

    if (await model.incrementPatch()) {
      return await this.success(`App ${model.name} update to new version: ${model.version}`);
    }
  }

  async actionIncrementMinor() {
    const model = await loopar.getDocument("App", this.name)

    if (await model.incrementMinor()) {
      return await this.success(`App ${model.name} update to new version: ${model.version}`);
    }
  }

  async actionIncrementMajor() {
    const model = await loopar.getDocument("App", this.name)

    if (await model.incrementMajor()) {
      return await this.success(`App ${model.name} update to new version: ${model.version}`);
    }
  }
}