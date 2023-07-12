
'use strict';

import {BaseDocument, loopar} from 'loopar-env';

export default class AppManager extends BaseDocument {
    constructor(props){
        super(props);
    }

    async pull(){
       //console.log('pulling app');
        const exist = await loopar.db.get_value('App', "name", this.app_name, null, null);

        if(!exist){
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

    async clone(){
        const app_name = this.git_repo.split('/').pop().replace('.git', '');
        const exist = await loopar.db.get_value('App', "name", app_name, null, null);
        
        if(exist){
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
}