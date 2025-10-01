'use strict';

import { loopar, BaseController } from 'loopar';

export default class AppController extends BaseController {
   constructor(props) {
      super(props);
   }

  async actionIncrementPatch() {
    return await this.#execute('incrementPatch');
  }

  async actionIncrementMinor() {
    return await this.#execute('incrementMinor');
  }

  async actionIncrementMajor() {
    return await this.#execute('incrementMajor');
  }

  async #execute(method){
    const model = await loopar.getDocument("App", this.name);
    if (model[method] && await model[method]()) {
      return await this.success(
        {version: model.version},
        {
          notify: { type: "success", message: `App ${model.name} update to new version: ${model.version}` }
        }
      );
    }
  }
}