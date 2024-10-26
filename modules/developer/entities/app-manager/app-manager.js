
'use strict';

import { BaseDocument, loopar } from 'loopar';

export default class AppManager extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async pull() {
    //console.log('pulling app');
    const exist = await loopar.db.getValue('App', "name", this.app_name);

    if (!exist) {
      loopar.throw(`App ${this.app_name} is not installed, please install it first`);
      return;
    }

    return new Promise((resolve, reject) => {
      loopar.git(this.app_name).pull(async (err, update) => {
        err && loopar.throw(err);

        //await loopar.make_config();
        resolve(true);
      });
    });
  }

  async clone() {
    const app_name = this.git_repo.split('/').pop().replace('.git', '');
    const exist = await loopar.db.getValue('App', "name", app_name);

    if (exist) {
      loopar.throw(`App ${app_name} is already installed, please update it instead`);
      return;
    }

    return new Promise((resolve, reject) => {
      loopar.git().clone(this.git_repo, async (err, update) => {
        err && loopar.throw(err);
        resolve(true);
      });
    });
  }

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
    /*return new Promise((resolve, reject) => {
        loopar.git().pull(async (err, update) => {
            err && loopar.throw(err);
            resolve(true);
        });
    });*/
  }
}