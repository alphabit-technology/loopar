'use strict'

import { BaseController, loopar } from 'loopar';
import { pluralize } from 'inflection';

const getTypes = () => Object.values(loopar.getTypes()).reduce((acc, type) => {
  acc.push({
    name: type.__NAME__,
    label: pluralize(type.__BUILD__ || type.__ENTITY__),
  });
  return acc;
}, []);

export default class ModuleController extends BaseController {
  async actionView() {
    const type = this.type || "Entity";
    const eType = `${type}DocumentQ`;
    const eModule = `${eType}Module`;
    const data = this.data || {};

    if (!data?.q) await loopar.session.set(eModule, this.name);

    const queryData = {
      ...(data?.q || await loopar.session.get(eType) || {}),
      module: await loopar.session.get(eModule)
    };

    /*Test if module exists*/
    if (queryData?.module) await loopar.getDocument("Module", queryData.module);
    /*Test if module exists*/
    
    await loopar.session.set(eType, queryData);
    await loopar.session.set(`${type}_page`, this.data.page || 1);
    const list = await loopar.getList(type, { q: queryData });

    list.rows = list.rows.map(row => {
      const ref = loopar.getRef(row.name);
      row.is_single = ref?.is_single || 0;

      return row;
    });

    list.__ENTITY__.name = "Module"; // Because need that action return to this Controller
    list.__TYPES__ = getTypes(); // List of types of entities
    list.__TYPE__ = type; // Current type of entity

    return this.render(list);
  }
}