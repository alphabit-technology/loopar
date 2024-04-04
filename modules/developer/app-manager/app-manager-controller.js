
'use strict';

import { InstallerController, loopar, fileManage } from 'loopar';
import fs from "fs";
import path from 'path';

export default class AppManagerController extends InstallerController {
  constructor(props) {
    super(props);

    this.action !== 'view' && this.method === 'GET' && this.redirect('view');
  }

  async actionView() {
    this.client = "view";
    const appsList = [];
    const apps = await loopar.getList('App', {fields: ["*"]});

    const dir = await fs.promises.opendir(loopar.makePath(loopar.pathRoot, "apps"));

    for await (const dirent of dir) {
      if (fs.lstatSync(path.resolve(loopar.makePath(loopar.pathRoot, "apps", dirent.name))).isDirectory()){
        const appData = fileManage.getConfigFile('installer', loopar.makePath("apps", dirent.name), null);

        for (const app of Object.values(appData?.App?.documents ?? {})) {
          const installedApp = await loopar.getApp(app.name);

          app.installed = !!installedApp;
          app.version ??= '0.0.1';
          app.installed_version = installedApp ? installedApp.version : app.version;
          app.valid_repo = loopar.gitRepositoryIsValid(app.git_repo);

          appsList.push(app);
        }
      }
    }

    apps.rows = appsList;

    /*apps.rows.forEach(installedApp => {
      const app = appsList.find(app => app.name === installedApp.name);

      if (app) {
        Object.assign(app, installedApp);
      }
    });

    for(const app of appsList) {
      if(!apps.rows.find(row => row.name === app.name)) {
        apps.rows.push(app);
      }
    }*/

    /**Because need that action return to this Controller */
    apps.__DOCTYPE__.name = "App Manager";


    return this.render(apps);

    /*this.response.apps = appsList;
    //return await this.render(this.response);
    await super.actionUpdate();*/
  }

  async actionPull() {
    const model = await loopar.newDocument('App Manager');

    Object.assign(model, { app_name: this.data.app_name });

    if (await model.pull()) {
      return await this.success('App updated successfully');
    }
  }

  async actionClone() {
    const model = await loopar.newDocument('App Manager');

    Object.assign(model, { git_repo: this.data.git_repo });

    if (await model.clone()) {
      return await this.success('App cloned successfully');
    }
  }

  async actionSyncInstaller() {
    const model = await loopar.getDocument("App", this.data.documentName)

    if (await model.syncFilesInstaller()) {
      return await this.success('Installer updated successfully');
    }
  }
}