'use strict'

import { BaseController, loopar } from 'loopar-env';

export default class ModuleController extends BaseController {
   constructor(props) {
      super(props);
   }

   async actionView() {
      if (this.hasData()) {
         const data = this.data;
         if (this.documentName) data.module = this.documentName;
         await loopar.session.set(this.document + '_q', data.q || {});
         await loopar.session.set(this.document + '_page', data.page || 1);
      } else {
         await loopar.session.set(this.document + '_q', { ...(this.data.q || {}), module: this.documentName });
      }
      const data = { ...loopar.session.get(this.document + '_q') || {} };

      const list = await loopar.getList("Document", { q: (data && Object.keys(data).length > 0) ? data : null });
      return this.render(list);
   }
}