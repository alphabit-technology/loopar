'use strict';

import { BaseDocument, fileManage, loopar } from 'loopar';

export default class App extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    const args = arguments[0] || {};
    if (this.__IS_NEW__ && this.git_repo && !["null", "undefined"].includes(this.git_repo)) {
      loopar.validateGitRepository(this.git_repo);

      const app_name = this.git_repo.split('/').pop().replace('.git', '');
      const app_status = await loopar.appStatus(app_name);

      if (fileManage.existFileSync(loopar.makePath('apps', app_name))) {
        if (app_status === 'installer')
          loopar.throw('App already exists, update or install it in <a href="/developer/App%20Manager/view" element="app-manage">App Manage</a>');
        else
          await super.save(args);
      } else {
        await loopar.git(app_name).clone(this.git_repo).then(async () => {
          const app_data = fileManage.getAppData(app_name);

          if (!app_data || !app_data.DeskWorkspace || !app_data.DeskWorkspace[app_name]) {
            loopar.throw('Invalid App Structure');
            return;
          }

          const data_info = app_data.DeskWorkspace[app_name];

          this.name = app_name;
          this.autor = data_info.autor;
          this.version = data_info.version;
          this.description = data_info.description;
          this.git_repo = data_info.git_repo;
          this.app_info = data_info.app_info;

          await super.save(args);
        });
      }
    } else {
      this.autor = !this.autor || this.autor === '' ? loopar.currentUser.email : this.autor;
      this.version = !this.version || this.version === '' ? '0.0.1' : this.version;
      await super.save(args);
      await this.makeAppStructure();
    }

    await loopar.build();

    return true;
  }

  async makeAppStructure() {
    if (loopar.installing) return;

    //await fileManage.makeFolder('apps', this.name);
    await fileManage.makeFolder(loopar.makePath('apps', this.name), 'modules');

    if (!fileManage.existFileSync(loopar.makePath('apps', this.name, 'installer.json'))) {
      await fileManage.setConfigFile('installer', {}, loopar.makePath('apps', this.name));
    }

    await fileManage.makeClass(loopar.makePath('apps', this.name), 'installer', {
      IMPORTS: {
        CoreInstaller: 'loopar'
      },
      EXTENDS: 'CoreInstaller',
    });

  }

  async syncFilesInstaller() {
    if (loopar.installing) return;

    if (await loopar.appStatus(this.name) !== 'installed') {
      loopar.throw('App is not installed yet, install it in <a href="/developer/App%20Manager/view" element="app-manage">App Manage</a>');
    }

    /**
     * Update App
     */
    const doc = await loopar.getDocument("Entity", "Entity");

    await loopar.updateInstaller({
      entity: this.__ENTITY__,
      name: this.__ENTITY__.name,
      appName: this.name,
      record: await this.rawValues()
    });

    /**
     * Update Modules
     */
    const moduleEntity = await loopar.getDocument("Entity", "Module");

    const modules = await loopar.db.getAll('Module', moduleEntity.writableFieldsList().map(field => field.data.name), {
      "=": { app_name: this.name }
    });

    await loopar.updateInstaller({
      entity: moduleEntity,
      name: "Module",
      appName: this.name,
      record: modules
    });

    /**
     * Update entities
     */
    const documents = await loopar.db.getAll('Entity', ["id", "name", "module", "type", "include_in_installer"], {
      "in": { module: modules.map(module => module.name) }
    });

    await loopar.updateInstaller({
      entity: doc,
      name: "Entity",
      appName: this.name,
      record: documents
    });

    /**
     * Update Module Group
     */
    if (this.name === "loopar") {
      const moduleGroupEntity = await loopar.getDocument("Entity", "Module Group");
      const moduleGroupList = await loopar.db.getAll('Module Group', moduleGroupEntity.writableFieldsList().map(field => field.data.name));

      await loopar.updateInstaller({
        entity: moduleGroupEntity,
        name: "Module Group",
        appName: this.name,
        record: moduleGroupList
      });
    }

    /**
     * Update Documents of Documents
     */
    for (const document of documents) {
      if (document.name === "Entity") continue;
      if (![true, "true", 1, "1"].includes(document.include_in_installer)) continue;
      const doc = await loopar.getDocument("Entity", document.name);
      if (doc.is_single) continue;

      //if (![true, "true", 1, "1"].includes(doc.include_in_installer)) continue;
      const fields = doc.writableFieldsList().map(field => field.data.name);

      const docs = await loopar.db.getAll(
        document.name,
        fields,
        fields.includes("app_name") ? {
          "=": { app_name: this.name }
        } : null,
        [true, "true", 1, "1"].includes(doc.is_single)
      );

      await loopar.updateInstaller({
        entity: doc,
        name: document.name,
        appName: this.name,
        record: docs
      });
    }

    return true;
  }

  async unInstall() {
    return await loopar.unInstallApp(this.name);

    /*loopar.installing = true;

    if (this.name === "loopar") {
       loopar.throw("You can't uninstall app Loopar");
    }

    const modules = await loopar.db.getAll("Module", ["name"], {
       '=': { app_name: this.name } 
    });

    //console.log("Uninstalling App", this.name, modules)
    loopar.db.beginTransaction();

    for (const module of modules) {
       const documents = await loopar.db.getAll("Entity", ["name"], {
          '=': { module: module.name } 
       });

       for (const document of documents) {
          //setTimeout(async () => {
             await loopar.deleteDocument("Entity", document.name, {updateInstaller: false, sofDelete: false});
          //}, 0);
          //await loopar.delete_document("Entity", document.name, false);
       }

       //setTimeout(async () => {
          await loopar.deleteDocument("Module", module.name, {updateInstaller: false});
       //}, 0);
    }

    await loopar.build();

    //setTimeout(async () => {
       await this.delete();

       console.log("App uninstalled", loopar.db.transactions);
       await loopar.db.endTransaction();
    //}, 0);
    //await this.delete();

    //loopar.db.endTransaction();

    return 'App uninstalled successfully';*/
  }
}