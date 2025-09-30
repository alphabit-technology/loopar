
'use strict';

import { BaseController, loopar } from 'loopar';
import EntityController from "../entity/entity-controller.js"

export default class BuilderController extends EntityController {
  constructor(props) {
    super(props);
  }

  async actionList2() {
    const builder = await loopar.newDocument("Builder", { name: "Builder", ...(this.data || {}).q || {} });
    const list = await builder.getList();

    list.rows = list.rows.map(row => {
      //const ref = loopar.getRef(row.name);
      return {
        ...row,
        type: 'builder',
      };
    });
    return this.render(list);
  }

  async actionList1() {
    if (this.hasData()) {
      const data = this.data;

      if (this.name) data.module = this.name;
      await loopar.session.set('Entity_q', data.q || {});
      await loopar.session.set('Entity_page', data.page || 1);
    } else {
      await loopar.session.set('Entity_q', { ...(this.data.q || {}), module: this.name });
    }


    const data = { ...loopar.session.get('Entity_q') || {} };
    const list = await loopar.getList("Entity", { q: (data && Object.keys(data).length > 0) ? data : null });

    /**Because need that action return to this Controller */
    list.__ENTITY__.name = "Builder";

    return this.render(list);
  }
}