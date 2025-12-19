'use strict';

import { BaseController, loopar } from 'loopar';
import * as LucideStatic from "lucide-static";
import { existsSync, readFileSync } from 'fs';
import path from "pathe";
const extraIcons = ["PiXLogo", "PiXLogoBold", "PiXLogoFill", "PiXLogoThin"];
let iconsCache = null;

const getIcons = async () => {
  if (!iconsCache) {
    const enables = [];

    extraIcons.forEach(icon => {
      enables.push({
        name: icon,
        label: icon
      })
    })

    Object.keys(LucideStatic).map(name => {
      const kebabName = name.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/Icon$/, '').toLowerCase();

      if(existsSync(
        path.join(loopar.pathRoot, `node_modules/lucide-static/icons/${kebabName}.svg`)
      )) enables.push({
        name: name,
        label: name,
        formattedValue: readFileSync(path.join(loopar.pathRoot, `node_modules/lucide-static/icons/${kebabName}.svg`), "utf-8")
      })
    });

    iconsCache = enables;
  }
  return iconsCache;
};

export default class IconManagerController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionSearch() {
    const q = this.q || '';
    const page = parseInt(this.page || 1);
    const limit = parseInt(this.limit || 50);

    const allIcons = await getIcons();
    const filtered = (q && q.length > 0) 
      ? allIcons.filter(icon => 
          icon.name && icon.name.toLowerCase().includes(q.toLowerCase())
        )
      : allIcons;

    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(Math.max(1, page), pages);
    const start = (currentPage - 1) * limit;
    const end = start + limit;

    const rows = filtered.slice(start, end);

    return {
      rows,
      title_fields: ["label"],
      pagination: {
        page: currentPage,
        limit,
        total,
        pages
      }
    };
  }

  async actionGetSvg() {
    const name = this.name;
    
    if (!name) {
      return { error: 'Icon name required' };
    }

    if (['PiXLogo', 'PiXLogoBold', 'PiXLogoFill', 'PiXLogoThin'].includes(name)) {
      return { name, svg: null, isExtra: true };
    }

    const allIcons = await getIcons();
    const icon = allIcons.find(i => i.name === name);
    
    if (!icon) {
      return { error: 'Icon not found' };
    }

    return { name, svg: icon.formattedValue };
  }
}