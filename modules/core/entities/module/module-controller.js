'use strict'

import { BaseController, loopar } from 'loopar';
import { pluralize } from 'inflection';

const getTypes = () => Object.values(loopar.getTypes()).reduce((acc, type) => {
  acc.push({
    name: type.__NAME__,
    label: pluralize(type.__BUILD__ || type.__ENTITY__)
  });
  return acc;
}, []);

export default class ModuleController extends BaseController {
  async actionView() {
    const data = this.data || {};
    const q = data.q || data;

    const types = (await Promise.all(
      getTypes().map(async t => await loopar.db.count(t.name, { "=": { module: this.name || q.module } }) > 0 ? t : null)
    )).filter(Boolean);

    const type = (!types.some(t => t.name == this.type)) ? (types.find(t => t.name == "Entity") || types[0])?.name : this.type;
    const eType = `${type}DocumentQ`;
    const eModule = `${eType}Module`;

    if (!data.q) await loopar.session.set(eModule, this.name);

    const queryData = {
      ...(data.q || await loopar.session.get(eType) || {}),
      module: await loopar.session.get(eModule),
    };

    if (queryData.module) await loopar.getDocument("Module", queryData.module);

    await loopar.session.set(eType, queryData);
    await loopar.session.set(`${type}_page`, this.data.page || 1);

    const list = await loopar.getList(type, { q: queryData });

    list.rows = list.rows.map(row => {
      const ref = loopar.getRef(row.name);
      return {
        ...row,
        is_single: ref?.is_single || 0,
        type: ref?.__ENTITY__ || "Entity",
      };
    });

    list.__ENTITY__.name = "Module";
    list.__TYPES__ = types;
    list.__TYPE__ = type;

    return this.render(list);
  }
}