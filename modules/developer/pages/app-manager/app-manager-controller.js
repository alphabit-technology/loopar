
'use strict';

import { SystemController, loopar, fileManage } from 'loopar';
import fs from "fs";
import path from 'path';

export default class AppManagerController extends SystemController {
  constructor(props) {
    super(props);

    this.action !== 'view' && this.method === 'GET' && this.redirect('view');
  }

  redirect(route = '/desk/App Manager/view') {
    return super.redirect(route);
  }

  async actionView() {
    this.client = "view";
    const appsList = [];
    const apps = await loopar.getList('App', { fields: ["*"] });
    const dir = await fs.promises.opendir(loopar.makePath(loopar.pathRoot, "apps"));

    for await (const dirent of dir) {
      if (fs.lstatSync(path.resolve(loopar.makePath(loopar.pathRoot, "apps", dirent.name))).isDirectory()) {
        const installerData = fileManage.getConfigFile('installer', loopar.makePath("apps", dirent.name), []);

        const app = installerData.App;

        if (app) {
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
    apps.__ENTITY__.name = "App Manager";


    return await this.render(apps);
  }

  async actionClone() {
    const model = await loopar.newDocument('App Manager');

    Object.assign(model, { git_repo: this.data.git_repo });

    if (await model.clone()) {
      return this.redirect();
    }
  }
}