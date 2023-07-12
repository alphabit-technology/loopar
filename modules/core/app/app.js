'use strict';

import {BaseDocument, file_manage, loopar} from 'loopar-env';
import path from "path";

export default class App extends BaseDocument {
   constructor(props) {
      super(props);
   }

   async save() {
      if(this.__IS_NEW__ && this.git_repo && !["null", "undefined"].includes(this.git_repo)){
         loopar.validateGitRepository(this.git_repo);

         const app_name = this.git_repo.split('/').pop().replace('.git', '');
         const app_status = await loopar.app_status(app_name);

         if(file_manage.exist_file_sync(path.join('apps', app_name))){
            if(app_status ==='installer')
               loopar.throw('App already exists, update or install it in <a href="/developer/App%20Manager/view" element="app-manage">App Manage</a>');
            else
               await super.save();
         }else {
            await loopar.git(app_name).clone(this.git_repo).then(async () => {
               const app_data = file_manage.get_app_data(app_name);

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

               await super.save();
            });
         }
      }else{
         this.autor = !this.autor || this.autor === '' ? loopar.current_user.email : this.autor;
         this.version = !this.version || this.version === '' ? '0.0.1' : this.version;
         await super.save();
         await this.make_app_structure();
      }

      if ([true, 'true', 1, '1'].includes(this.default_app) && this.type === 'Web App'){
         loopar.default_web_app = this.name;
      }else{
         if (loopar.default_web_app === this.name){
            loopar.default_web_app = null;
         }
      }
   }

   async make_app_structure() {
      if(loopar.installing) return;

      const name_to_path = this.name.replaceAll(" ", "-").toLowerCase();
      await file_manage.make_folder('apps', name_to_path);
      await file_manage.make_folder(path.join('apps', name_to_path), 'modules');

      if (!file_manage.exist_file_sync(path.join('apps', name_to_path, 'installer.json'))) {
         await file_manage.set_config_file('installer', {}, 'apps/' + name_to_path);
      }

      const values = await this.rawValues();
      await loopar.update_installer(path.join("apps", name_to_path), this.__DOCTYPE__.name, this.name, values);
   }

   async set_apps(){
      await file_manage.set_config_file('apps', {}, 'apps');
      const apps = file_manage.get_config_file('apps', "apps") || {};

      apps[this.name] = apps[this.name] || {};

      await file_manage.set_config_file('apps', apps, "apps");
   }
}