'use strict'

import { BaseController, loopar } from 'loopar';

export default class ModuleController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionView() {
    if (this.hasData()) {
      const data = this.data;
      if (this.documentName) data.module = this.documentName;
      await loopar.session.set('Document_q', data.q || {});
      await loopar.session.set('Document_page', data.page || 1);
    } else {
      await loopar.session.set('Document_q', { ...(this.data.q || {}), module: this.documentName });
    }
    const data = { ...loopar.session.get('Document_q') || {} };

    const list = await loopar.getList("Document", { q: (data && Object.keys(data).length > 0) ? data : null });

    /**Because need that action return to this Controller */
    list.__DOCTYPE__.name = "Module";

    return this.render(list);
  }
}