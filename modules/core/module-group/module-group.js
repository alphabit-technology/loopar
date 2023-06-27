'use strict';

import {BaseDocument, loopar} from 'loopar-env';
import path from "path";

export default class ModuleGroup extends BaseDocument {
   constructor(props) {
      super(props);
   }

   async save() {
      await super.save();
      await this.update_installer();
   }

   app_path() {
      return path.join('apps/loopar');
   }

   async update_installer(delete_module_group = false) {
      await loopar.update_installer(this.app_path(), this.__DOCTYPE__.name, this.name, this.values, delete_module_group);
   }
}