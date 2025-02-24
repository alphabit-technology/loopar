
'use strict';

import { BaseController, loopar } from 'loopar';

export default class BuilderController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionList() {
    const builder = await loopar.newDocument("Builder", { name: "Builder", ...(this.data || {}).q || {} });
    return this.render(await builder.getList());
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