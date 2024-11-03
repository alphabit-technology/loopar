
'use strict';

import { CoreInstaller, loopar } from 'loopar';

export default class AppManager extends CoreInstaller {
  async updateIntaller() {
    const modules = await loopar.db.getAll('Module', ["name"]);

    for (const module of modules) {
      const document = await loopar.getDocument(module.name);

      if (document.include_in_installer) {
        if (document.name === "Entity") {
          loopar.updateInstaller({
            document: "Entity",
            appName: "loopar",
            record: await loopar.db.getAll("Entity", ["id", "name"])
          });
        } else {
          /*const records = await loopar.db.getAll(document.name, this.writableFieldsList().map(field => field.data.name));

          loopar.updateInstaller({
              document: data.name,
              appName: app_name,
              record: records,
              deleteRecord: delete_document
          });*/
        }
      }
    }
  }

  async clone() {
    return super.clone(this.git_repo);
  }
}