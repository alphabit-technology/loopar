'use strict'

import { BaseDocument, fileManage, loopar } from "loopar";

export default class Module extends BaseDocument {
   constructor(props) {
      super(props);
   }

   async save() {
      await super.save(arguments[0] || {});
      await this.makeModuleRoute();
      await loopar.makeConfig();
   }

   appPath() {
      return loopar.makePath('apps', this.app_name);
   }

   modulePath() {
      return loopar.makePath(this.appPath(), 'modules');
   }

   async makeModuleRoute() {
      await fileManage.makeFolder(this.modulePath(), this.name.replaceAll(/\s+/g, '-').toLowerCase());
   }

   async getDocumentList(data){
      const documentList = await loopar.getList("Document", data);
   /*return Object.assign((rowsOnly ? {} : await this.__data__()), {
      labels: this.getFieldListLabels(),
      fields: listFields,
      rows: rows,
      pagination: selfPagination,
      q
   });*/
   }
}