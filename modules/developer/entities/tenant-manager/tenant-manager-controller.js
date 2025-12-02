
'use strict';

import {BaseController} from 'loopar';
import {loopar} from 'loopar';

import {getTenant, tenantList} from "./tenant-manager.js";

export default class TenantManagerController extends BaseController {
  constructor(props){
    super(props);
    if(loopar.tenantId != "core") loopar.throw("Access restricted")
  }

  async getTenant(name=this.name){
    return await getTenant(name);
  }

  async actionList(){
    return super.render(await tenantList());
  }

  async actionCreate(){
    if(!this.hasData()){
      return super.actionCreate();
    }

    const tenant = await loopar.newDocument("Tenant Manager", this.data);
    await tenant.save();
    return this.success("Tenant created successfully");
  }

  async actionUpdate(){
    const tenant = await this.getTenant();
    if(this.hasData()){
      Object.entries(this.data).forEach(([key, value]) => {
        tenant[key] = value;
      });
      await tenant.save();
      return this.success("Tenant updated successfully");
    }else{
      return await this.render(await tenant.__meta__());
    }
  }

  async actionProduction(){
    const r = await this.makeAction("setOnProduction");
    return this.success(r ? "Tenant set on production successfully" : "Tenant set on production failed", { notify: { type: r ? "success" : "error" } });
  }

  async actionDevelopment(){
    const r = await this.makeAction("setOnDevelopment");
    return this.success(r ? "Tenant set on development successfully" : "Tenant set on development failed", { notify: { type: r ? "success" : "error" } });
  }

  async actionStart(){
    const r = await this.makeAction("start");
    return this.success(r ? "Tenant started successfully" : "Tenant start failed", { notify: { type: r ? "success" : "error" } });
  }

  async actionStop(){
    const r = await this.makeAction("stop");
    return this.success(r ? "Tenant stopped successfully" : "Tenant stop failed", { notify: { type: r ? "warning" : "error" } });
  }

  async actionRestart(){
    const r = await this.makeAction("restart");
    return this.success(r ? "Tenant restarted successfully" : "Tenant restart failed", { notify: { type: r ? "warning" : "error" } });
  }

  async actionSetOnProduction(){
    const r = await this.makeAction("setOnProduction");
    return this.success(r ? "Tenant set on production successfully" : "Tenant set on production failed", { notify: { type: r ? "success" : "error" } });
  }

  async makeAction(action){
    const tenant = await this.getTenant();
    return await tenant[action]();
  }
}