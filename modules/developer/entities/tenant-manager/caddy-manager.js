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
      console.log("Caddy started");
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
    console.log(`🗑️  Removing tenant: ${domain}`);
    
    try {
      const getResponse = await fetch(`${this.adminUrl}/config/apps/http/servers`);
      
      if (!getResponse.ok) {
        throw new Error('Failed to get Caddy config');
      }
      
      const servers = await getResponse.json();
      
      let foundServerName = null;
      let foundRouteIndex = -1;
      
      for (const [serverName, server] of Object.entries(servers)) {
        if (!server.routes) continue;
        
        foundRouteIndex = server.routes.findIndex(route => {
          const hasMatch = route.match?.some(match => 
            match.host?.includes(domain)
          );
          
          const hasId = route['@id'] === `tenant_${domain}` || route['@id']?.includes(domain);
          
          return hasMatch || hasId;
        });
        
        if (foundRouteIndex !== -1) {
          foundServerName = serverName;
          break;
        }
      }
      
      if (!foundServerName || foundRouteIndex === -1) {
        console.log(`ℹ️  Tenant ${domain} not found in Caddy`);
        return true;
      }
      
      console.log(`  Found in server "${foundServerName}" at route index ${foundRouteIndex}`);
      
      const deletePath = `/config/apps/http/servers/${foundServerName}/routes/${foundRouteIndex}`;
      console.log(`  DELETE ${deletePath}`);
      
      const deleteResponse = await fetch(`${this.adminUrl}${deletePath}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete route: ${deleteResponse.statusText} - ${errorText}`);
      }
      
      console.log(`✅ Tenant ${domain} removed from Caddy`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyResponse = await fetch(`${this.adminUrl}/config/apps/http/servers`);
      const verifyServers = await verifyResponse.json();
      
      const stillExists = Object.values(verifyServers).some(server => 
        server.routes?.some(route => 
          route.match?.some(match => 
            match.host?.includes(domain)
          ) || route['@id']?.includes(domain)
        )
      );
      
      if (stillExists) {
        console.error(`❌ Domain ${domain} still exists after deletion!`);
        console.log('Attempting force removal...');
        return await this.forceRemoveTenant(domain);
      }
      
      return true;
      
    } catch (e) {
      console.error(`❌ Failed to remove tenant ${domain}:`, e.message);
      return false;
    }
  }

  async forceRemoveTenant(domain) {
    console.log(`🔨 Force removing tenant: ${domain}`);
    
    try {
      const getResponse = await fetch(`${this.adminUrl}/config/apps/http/servers`);
      const servers = await getResponse.json();
      
      let removed = false;
      
      for (const [serverName, server] of Object.entries(servers)) {
        if (!server.routes) continue;
        
        const originalLength = server.routes.length;
        
        server.routes = server.routes.filter(route => {
          const hasMatch = route.match?.some(match => 
            match.host?.includes(domain)
          );
          const hasId = route['@id']?.includes(domain);
          
          if (hasMatch || hasId) {
            console.log(`  🗑️  Removing: ${route['@id'] || domain}`);
            removed = true;
            return false;
          }
          
          return true;
        });
        
        if (server.routes.length !== originalLength) {
          console.log(`  Removed ${originalLength - server.routes.length} route(s) from ${serverName}`);
        }
      }
      
      if (!removed) {
        console.log(`ℹ️  No routes found for ${domain}`);
        return true;
      }
      
      const updateResponse = await fetch(`${this.adminUrl}/config/apps/http/servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(servers)
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to update config: ${updateResponse.statusText}`);
      }
      
      console.log(`✅ Force removal successful for ${domain}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyResponse = await fetch(`${this.adminUrl}/config/apps/http/servers`);
      const verifyServers = await verifyResponse.json();
      
      const stillExists = Object.values(verifyServers).some(server => 
        server.routes?.some(route => 
          route.match?.some(match => 
            match.host?.includes(domain)
          )
        )
      );
      
      if (stillExists) {
        console.error(`❌ Force removal failed - domain still exists!`);
        console.log('You may need to restart Caddy manually');
        return false;
      }
      
      return true;
      
    } catch (e) {
      console.error(`❌ Force removal failed:`, e.message);
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

      const child = exec(`caddy start --config ${caddyConfigPath}`, (error, stdout, stderr) => {
        if (error) console.log("Caddy start info:", error.message);
        if (stdout) console.log("Caddy stdout:", stdout);
        if (stderr) console.log("Caddy stderr:", stderr);
      });

      child.unref();

      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const running = await this.isRunning();
        if (running) {
          console.log("✅ Caddy is running");
          return true;
        }
        console.log(`⏳ Waiting for Caddy... (${i + 1}/10)`);
      }

      console.error("❌ Caddy failed to start after 5 seconds");
      return false;

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
                "listen": [":443", ":80"],
                "routes": []
              }
            }
          },
          "tls": {
            "automation": {
              "policies": [{
                "issuers": [{
                  "module": "acme"
                }]
              }]
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