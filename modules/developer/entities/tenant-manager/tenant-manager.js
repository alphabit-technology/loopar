'use strict';

import {BaseDocument} from 'loopar';
import {getAllApps} from "./tenant-list.js";
import {loopar} from 'loopar';
import pm2 from "pm2";
import fs from "fs";
import path from "pathe";
import CaddyManager from "./caddy-manager.js";
const tenantsDir = path.join(process.cwd(), 'sites');
import { promisify } from 'util';

const pm2Describe = promisify(pm2.describe.bind(pm2));
const pm2List = promisify(pm2.list.bind(pm2));
const pm2Start = promisify(pm2.start.bind(pm2));

const getTenantData = async (name, onNotFound='throw') => {
  const tenantPath = path.join(tenantsDir, name);
  const envFile = path.join(tenantPath, '.env');
  const allApps = getAllApps();
  const app = allApps.find(app => app.name === name);

  if(!app || !fs.existsSync(envFile)){
    if(onNotFound == 'throw') return loopar.throw(`Tenant ${name} not found`);
    return onNotFound
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmedLine.split('=');
    const trimmedKey = key?.trim();
    
    if (trimmedKey) {
      const value = valueParts.join('=').trim();
      env[trimmedKey] = value ?? null;
    }
  });

  return {
    ...app,
    env: {
      ...app.env,
      ...env
    }
  }
}

const tenantStatus = async (tenant) => {
  try {
    const processDescription = await pm2Describe(tenant.name);
    return processDescription[0]?.pm2_env?.status || "stopped";
  } catch (err) {
    return "stopped";
  }
}

export default class TenantManager extends BaseDocument {
  constructor(props){
    super(props);
    this.caddy = new CaddyManager();
  }

  get allApps(){
    return getAllApps();
  }

  async getStatus(){
    return await tenantStatus(this);
  }

  async __data__(){
    return await getTenantData(this.name);
  }

  async getCaddyRoutes() {
    try {
      const response = await fetch(`${this.caddy.adminUrl}/config/apps/http/servers`);
      if (!response.ok) {
        throw new Error('Caddy API not available');
      }
      return await response.json();
    } catch (err) {
      console.error('Error getting Caddy routes:', err.message);
      return {};
    }
  }

  async getAllConnectedDomains() {
    const servers = await this.getCaddyRoutes();
    const domains = [];

    for (const [serverName, server] of Object.entries(servers)) {
      if (!server.routes) continue;

      for (const route of server.routes) {
        if (!route.match) continue;

        for (const match of route.match) {
          if (!match.host) continue;

          for (const host of match.host) {
            const upstream = route.handle?.find(h => h.handler === 'reverse_proxy');
            const dialMatch = upstream?.upstreams?.[0]?.dial?.match(/localhost:(\d+)/);
            const port = dialMatch ? parseInt(dialMatch[1]) : null;

            const routeId = route['@id'] || null;

            domains.push({
              domain: host,
              port: port,
              routeId: routeId,
              serverName: serverName
            });
          }
        }
      }
    }

    return domains;
  }

  async isDomainInUse(domain) {
    const allDomains = await this.getAllConnectedDomains();
    const currentDomain = allDomains.find(d => d.domain === domain);

    if(currentDomain && currentDomain.port != this.port){
      return true;
    }

    return false;
  }

  async disconnectDomain(){
    const tenantPath = path.join(tenantsDir, this.name);
     const envFile = path.join(tenantPath, '.env');
     if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const oldDomain = envContent.match(/DOMAIN=(\d+)/);
      if (oldDomain) {
        await this.removeDomain(oldDomain);
      }
    }

    if(await this.isDomainInUse(this.domain)){
      if(this.force_connect !== 1){
        return loopar.throw("Domain already in use, try another domain or use force to override");
      }else{
        await this.removeDomain(this.domain);
      }
    }
  }

  async save(){
    await this.validate();
    if(this.__IS_NEW__ && this.allApps.find(app => app.name === this.name)){
      return loopar.throw("Tenant already exists, try another name");
    }
    
    const tenantPath = path.join(tenantsDir, this.name);
    const envFile = path.join(tenantPath, '.env');
    
    await this.disconnectDomain();

    if(!fs.existsSync(tenantPath)){
      fs.mkdirSync(tenantPath);
    }

    const data = await this.rawValues();
    const tenantData = {};

    for(const [key, value] of Object.entries(data)){
      tenantData[key.toUpperCase()] = value;
    }
    
    const envContent = Object.entries(tenantData)
      .filter(([key, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    
    fs.writeFileSync(envFile, envContent);

    if(await this.getStatus() === "online"){
      await this.restart();
    }
    
    return true;
  }

  async setOnDevelopment(){
    return await this.setEnviroment("development")
  }

  async setOnProduction(){
    return await this.setEnviroment("production")
  }

  async setEnviroment(mode){
    this.node_env = mode;
    await this.save();
    return true;
  }

  async start(){
    await this.initInstance();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this;
}

  async stop(){
    return await this.#pm2Action("stop");
  }

  async removeDomain(dommain){
    await this.caddy.removeTenant(dommain);
  }

  async restart() {
    const restarted = await this.#pm2Action("restart");
    
    if (restarted && this.domain) {
      await this.removeDomain();
      await this.caddy.registerTenant(this.domain, this.port);
    }
    
    return restarted;
  }

  validateDomain(domain) {
    if (typeof domain !== "string") return false;

    domain = domain.trim().toLowerCase();

    if (domain.endsWith('.localhost') || domain === 'localhost') {
      const localhostRegex = /^(?!-)([a-z0-9-]{1,63}\.)*localhost$/;
      return localhostRegex.test(domain);
    }

    const regex = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;
    return regex.test(domain);
  }

  async validate(){
    if (this.domain && this.domain.trim()) {
      if(!this.validateDomain(this.domain)){
        return loopar.throw("Invalid domain");
      }

      const existingTenant = this.allApps.find(app => 
        app.env.DOMAIN === this.domain && app.name !== this.name
      );
      
      if (existingTenant) {
        return loopar.throw(`Domain ${this.domain} is already used by tenant ${existingTenant.name}`);
      }
    }

    await super.validate();
  }

  #hasDomain() {
    return this.domain && this.domain.trim() !== '';
  }

  #isProduction() {
    return this.production === true || this.production === 'true' || this.production === '1';
  }

  async initInstance() {
    await this.validate();

    this.node_env = "production";
    await this.save();
    
    const hasDomain = this.#hasDomain();
    
    console.log('\n========================================');
    console.log('CONFIGURING TENANT');
    console.log('========================================');
    console.log('Name:', this.name);
    console.log('Domain:', this.domain || '[none]');
    console.log('Port:', this.port);
    console.log('Has domain:', hasDomain);
    console.log('========================================\n');

    if (hasDomain) {
      console.log('🌐 Setting up Caddy reverse proxy...\n');
      
      try {
        await this.caddy.ensureReady();
        const registered = await this.caddy.registerTenant(this.domain, this.port);
        
        if (!registered) {
          return loopar.throw("Could not register tenant in Caddy.");
        }
      } catch (err) {
        console.error(err);
        return loopar.throw(err.message || "Caddy configuration failed");
      }

    } else {
      console.log('ℹ️  No domain configured, skipping Caddy setup');
      console.log(`ℹ️  Tenant will be accessible via: http://localhost:${this.port}\n`);
    }

    await this.#pm2Action("start");

    console.log('\n✅ ✅ ✅ TENANT CONFIGURED SUCCESSFULLY ✅ ✅ ✅');
    if (hasDomain) {
      console.log(`🌐 Access via: http://${this.domain}`);
    } else {
      console.log(`🔌 Access via: http://localhost:${this.port}`);
    }
    
    console.log(`📊 Mode: ${this.#isProduction() ? 'production' : 'development'}`);
    console.log('');
    
    return true;
  }

  async #pm2Action(action) {
    return new Promise(resolve => {
      const finish = (success, message, err = null) => {
        pm2.disconnect();
        if (err) {
          console.error(message, err);
          return resolve(false);
        }
        console[success ? 'log' : 'error'](`${success ? '✅' : '❌'} ${this.name} ${message}`);
        resolve(success);
      };

      pm2.connect(async err => {
        if (err) {
          return finish(false, "PM2 connection error:", err);
        }

        let config = null;
        if (action === "start" || action === "restart") {
          config = await this.__data__();
          const NODE_ENV = config.env.NODE_ENV || "development";
          console.log(["Restarting", NODE_ENV]);
          if (!config) {
            return finish(false, "Tenant not found in ecosystem.");
          }
          config.exec_mode = (NODE_ENV == 'production' ? 'cluster' : 'fork');
          config.instances = (NODE_ENV == 'production' ? 1 : 1);
        }

        const handlePm2Operation = (operationFn, successMsg, errorMsg) => {
          operationFn((err) => {
            if (err) return finish(false, errorMsg, err);
            finish(true, successMsg);
          });
        };

        switch (action) {
          case "start":
            handlePm2Operation(
              (cb) => pm2.start(config, cb),
              "started successfully",
              "PM2 start error:"
            );
            break;
                
          case "restart":
            if(this.name != "dev"){
                pm2.delete(this.name, () => {
                  handlePm2Operation(
                    (cb) => pm2.start(config, cb),
                    "restarted with NEW config successfully",
                    "PM2 restart (re-spawn) error:"
                  );
                });
              }else{
                handlePm2Operation(
                  (cb) => pm2.restart(config, cb),
                  "restarted with NEW config successfully",
                  "PM2 restart (re-spawn) error:"
                );
              }
            break;

          default:
            handlePm2Operation(
              (cb) => pm2[action](this.name, cb),
              `${action} successful`,
              `PM2 ${action} error:`
            );
          break;
        }
      });
    });
  }
}

const getTenant = async (name, isNew=false) => {
  const app = await getTenantData(name);
  
  const doc = await loopar.newDocument("Tenant Manager", {
    id: app.name,
    port: app.env.PORT,
    domain: app.env.DOMAIN,
    node_env: app.env.NODE_ENV
  });
  doc.name = app.name;
  doc.__IS_NEW__ = isNew;
  return doc;
}
  
const tenantList = async () => {
  const mappedallApps = [];
  const allApps = getAllApps();
  for(const appDef of allApps){
    const app = await getTenantData(appDef.name, false);
    app && mappedallApps.push({
      name: app.name,
      port: app.env.PORT,
      domain: app.env.DOMAIN,
      status: await tenantStatus(app),
      node_env: app.env.NODE_ENV
    })
  }

  const model = await loopar.getList("Tenant Manager");
  model.rows = [...mappedallApps].sort((a, b) => (b.name === "dev") - (a.name === "dev"));
  return model;
}

export {getTenant, tenantList};