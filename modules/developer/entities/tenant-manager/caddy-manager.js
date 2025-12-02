'use strict';

import fs from "fs";
import path from "pathe";
import os from "os";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default class CaddyManager {
  constructor() {
    this.adminUrl = 'http://localhost:2019';
  }

  async ensureReady() {
    const isInstalled = await this.ensureInstalled();
    if (!isInstalled) {
      console.log("Caddy not found. Installing...");
      const installed = await this.install();
      if (!installed) throw new Error("Could not install Caddy manually.");
    }

    const isRunning = await this.isRunning();
    if (!isRunning) {
      console.log("Starting Caddy...");
      const started = await this.start();
      if (!started) throw new Error("Could not start Caddy.");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const httpReady = await this.ensureHttpConfig();
    if (!httpReady) throw new Error("Could not initialize Caddy HTTP configuration.");

    return true;
  }

  async registerTenant(domain, port) {
    try {
      await this.removeTenant(domain);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('📝 Registering in Caddy...');
      
      const routeConfig = {
        "@id": `tenant_${domain}`,
        "match": [{ "host": [domain] }],
        "handle": [{
          "handler": "reverse_proxy",
          "upstreams": [{ "dial": `localhost:${port}` }]
        }]
      };

      console.log(`Registering: ${domain} → localhost:${port}`);

      const response = await fetch(`${this.adminUrl}/config/apps/http/servers/srv0/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Caddy API error:", response.status, errorText);
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      const verified = await this.verifyRegistration(domain);
      
      if (verified) {
        console.log(`✅ Tenant accessible via: http://${domain}\n`);
        return true;
      }
      return false;

    } catch (e) {
      console.error("Failed to register on Caddy:", e);
      return false;
    }
  }

  async removeTenant(domain) {
    try {
      const response = await fetch(`${this.adminUrl}/id/tenant_${domain}`, {
        method: 'DELETE'
      });

      if (response.status === 200) {
        console.log(`✅ Tenant ${domain} removed from Caddy`);
        return true;
      } else if (response.status === 404) {
        console.log(`ℹ️  Tenant ${domain} was not registered in Caddy`);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to remove from Caddy:", e);
      return false;
    }
  }

  async verifyRegistration(domain) {
    try {
      const response = await fetch(`${this.adminUrl}/config/apps/http/servers/srv0/routes`);
      const routes = await response.json();
      
      const found = routes.find(r => r['@id'] === `tenant_${domain}`);
      
      if (found) {
        const upstream = found.handle?.[0]?.upstreams?.[0]?.dial;
        console.log(`✅ Caddy registration verified: ${domain} → ${upstream}`);
        return true;
      }
      console.error(`❌ Caddy registration NOT found for ${domain}`);
      return false;
    } catch (e) {
      console.error('Error verifying Caddy registration:', e.message);
      return false;
    }
  }

  async isRunning() {
    try {
      const response = await fetch(`${this.adminUrl}/config/`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async ensureInstalled() {
    try {
      await execAsync('caddy version');
      return true;
    } catch (e) {
      return false;
    }
  }

  async install() {
    try {
      console.log("Installing Caddy...");
      const platform = os.platform();
      
      if (platform === 'darwin') {
        await execAsync('brew install caddy');
      } else if (platform === 'linux') {
        await execAsync('sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl');
        await execAsync('curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg');
        await execAsync('curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | sudo tee /etc/apt/sources.list.d/caddy-stable.list');
        await execAsync('sudo apt update');
        await execAsync('sudo apt install -y caddy');
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      
      console.log("Caddy installed successfully");
      return true;
    } catch (e) {
      console.error("Failed to install Caddy:", e);
      return false;
    }
  }

  async start() {
    try {
      const caddyConfigPath = this._getCaddyConfigPath();
      
      if (!fs.existsSync(caddyConfigPath)) {
        this._createDefaultCaddyConfig(caddyConfigPath);
      }

      try {
        await execAsync(`caddy start --config ${caddyConfigPath} --adapter json`);
        return true;
      } catch (error) {
        console.log("Trying alternative Caddy start method...");
        exec(`caddy run --config ${caddyConfigPath} --adapter json > /dev/null 2>&1 &`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await this.isRunning();
      }
    } catch (e) {
      console.error("Failed to start Caddy:", e);
      return false;
    }
  }

  async ensureHttpConfig() {
    try {
      const checkResponse = await fetch(`${this.adminUrl}/config/apps/http`);
      if (checkResponse.ok) return true;

      console.log("Initializing Caddy HTTP configuration...");
      const httpConfig = {
        "apps": {
          "http": {
            "servers": {
              "srv0": {
                "listen": [":80"],
                "routes": []
              }
            }
          }
        }
      };

      const response = await fetch(`${this.adminUrl}/config/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(httpConfig)
      });

      return response.ok;
    } catch (e) {
      console.error("Failed to ensure HTTP config:", e);
      return false;
    }
  }

  _getCaddyConfigPath() {
    const possiblePaths = [
      '/etc/caddy/config.json',
      '/usr/local/etc/caddy/config.json',
      '/opt/homebrew/etc/caddy/config.json',
      path.join(process.cwd(), 'caddy-config.json')
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }

    const dir = os.platform() === 'darwin' ? '/opt/homebrew/etc/caddy' : '/etc/caddy';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'config.json');
  }

  _createDefaultCaddyConfig(filePath) {
    const defaultConfig = {
      "admin": { "listen": "localhost:2019" },
      "apps": {
        "http": {
          "servers": {
            "srv0": { "listen": [":80"], "routes": [] }
          }
        }
      }
    };
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created default Caddy config at ${filePath}`);
  }
}