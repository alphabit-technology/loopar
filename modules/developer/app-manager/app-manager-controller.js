
'use strict';

import { InstallerController, loopar, fileManage } from 'loopar-env';
import fs from "fs";

export default class AppManagerController extends InstallerController {
    constructor(props) {
        super(props);

        this.action !== 'view' && this.method === 'GET' && this.redirect('view');
    }

    async actionView() {
        this.client = "view";
        const apps_list = [];

        const dir = await fs.promises.opendir(loopar.makePath(loopar.pathRoot, "apps"));

        for await (const dirent of dir) {
            const appData = fileManage.getConfigFile('installer', loopar.makePath("apps", dirent.name), null);

            if (appData && appData.App && appData.App.documents) {
                for (const app of Object.values(appData.App.documents)) {
                    const installedApp = await loopar.getApp(app.name);

                    app.installed = !!installedApp;
                    app.version ??= '0.0.1';
                    app.installed_version = installedApp ? installedApp.version : app.version;
                    app.valid_repo = loopar.gitRepositoryIsValid(app.git_repo);

                    apps_list.push(app);
                }
            }
        }

        this.response.apps = apps_list;
        await super.actionUpdate();
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

    async actionUpdateInstaller() {
        const model = await loopar.getDocument("App", this.data.documentName)

        console.log("update installer", model)
        if (await model.syncFilesInstaller()) {
            return await this.success('Installer updated successfully');
        }
    }
}