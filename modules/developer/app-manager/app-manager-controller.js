
'use strict';

import {InstallerController, loopar, file_manage} from 'loopar-env';
import fs from "fs";

export default class AppManagerController extends InstallerController {
    constructor(props){
        super(props);

        this.action !== 'view' && this.method === 'GET' && this.redirect('view');
    }

    async action_view(){
        this.client = "view";
        const apps_list = [];

        const dir = await fs.promises.opendir(loopar.path_root + "/apps");

        for await (const dirent of dir) {
            const app_data = file_manage.get_config_file('installer', "apps/" + dirent.name, null);

            if(app_data && app_data.App) {
                for (const app of Object.values(app_data.App)) {
                    const installed_app = await loopar.get_app(app.name);
                    app.installed = !!installed_app;
                    app.version ??= '0.0.1';
                    app.installed_version = installed_app ? installed_app.version : app.version;
                    app.valid_repo = loopar.gitRepositoryIsValid(app.git_repo);

                    apps_list.push(app);
                }
            }
        }

        this.response.apps = apps_list;
        await super.action_update();
    }

    async action_pull(){
        const model = await loopar.new_document('App Manager');

        Object.assign(model, {app_name: this.data.app_name});

        if (await model.pull()) {
            return await this.success('App updated successfully');
        }
    }
}