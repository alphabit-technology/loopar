'use strict'

import {BaseController, loopar} from 'loopar-env';

export default class ModuleController extends BaseController {
   constructor(props) {
      super(props);
   }

   async action_view(){
      if (this.has_data()) {
         const data = this.data;
         if (this.document_name) data.module = this.document_name;
         await loopar.session.set(this.document + '_q', data.q || {});
         await loopar.session.set(this.document + '_page', data.page || 1);
      }else{
         await loopar.session.set(this.document + '_q', { ...(this.data.q || {}), module: this.document_name });
      }
      const data = { ...loopar.session.get(this.document + '_q') || {} };

      const list = await loopar.get_list("Document", { q: (data && Object.keys(data).length > 0) ? data : null });
      return this.render(list);
   }
}