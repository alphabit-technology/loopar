'use strict'

import { BaseController, loopar } from 'loopar';
import { pluralize } from 'inflection';

const getTypes = () => Object.values(loopar.getTypes()).reduce((acc, type) => {
  acc.push({
    name: type.__ENTITY__,
    label: pluralize(type.__BUILD__)
  });
  return acc;
}, []);

export default class ModuleController extends BaseController {
  async actionView() {
    const type = this.type || "Entity";
    const eType = `${type}DocumentQ`;
    const eModule = `${eType}Module`;

    if (!this.data?.q) await loopar.session.set(eModule, this.name);

    const queryData = {
      ...(this.data?.q || await loopar.session.get(eType) || {}),
      module: await loopar.session.get(eModule)
    };

    await loopar.session.set(eType, queryData);
    await loopar.session.set(`${type}_page`, this.data.page || 1);

    const list = await loopar.getList(type, { q: queryData });

    list.__ENTITY__.name = "Module"; // Because need that action return to this Controller
    list.__TYPES__ = getTypes(); // List of types of entities
    list.__TYPE__ = type; // Current type of entity

    return this.render(list);
  }
}