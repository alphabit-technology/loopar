'use strict';

import { BaseDocument, loopar } from 'loopar';
import path from "path";

export default class ModuleGroup extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save();
  }

  app_path() {
    return path.join('apps/loopar');
  }

  async updateIinstaller(delete_module_group = false) {
    const values = await this.values();
    loopar.updateInstaller({
      document: this.__ENTITY__.name,
      name: this.name,
      appName: "loopar",
      documentParent: this.__ENTITY__.name,
      deleteRecord: delete_module_group,
      data: values
    });
    //await loopar.update_installer(this.app_path(), this.__ENTITY__.name, this.name, values, delete_module_group);
  }
}