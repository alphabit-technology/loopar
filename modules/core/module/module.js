'use strict'

import {BaseDocument, file_manage, loopar} from "loopar-env";
import path from "path";

export default class Module extends BaseDocument {
   constructor(props) {
      super(props);
   }

   async save(){
      await super.save(arguments[0] || {});
      await this.make_module_route();
      await this.update_installer();
      await loopar.make_config();
   }

   app_path() {
      return loopar.makePath('apps', this.app_name);
   }

   module_path() {
      return loopar.makePath(this.app_path(), 'modules');
   }

   async make_module_route() {
      await file_manage.make_folder(this.module_path(), this.name.replaceAll(/\s+/g, '-').toLowerCase());
   }

   async update_installer(delete_module = false) {
      const values = await this.values();
      await loopar.update_installer(this.app_path(), this.__DOCTYPE__.name, this.name.replaceAll(/\s+/g, '-').toLowerCase(), values, delete_module);
   }
}