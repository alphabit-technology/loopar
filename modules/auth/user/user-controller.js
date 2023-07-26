'use strict'

import { BaseController, loopar } from "loopar-env";

export default class UserController extends BaseController {
   constructor(props) {
      super(props);
   }

   async action_update() {
      this.context ??= 'form';
      const document = await loopar.getDocument("User", this.document_name, this.has_data() ? this.data : null);

      if (this.has_data()) {
         await document.save();
         return this.render({ success: true, message: `Document ${document.name} saved successfully`, document_name: document.name });
      } else {
         document.password = document.protected_password;
         document.confirm_password = document.protected_password;

         Object.assign(this.response, await document.__data__());
         this.response.app = 'form';

         return this.render(this.response);
      }
   }

   action_logout() {
      loopar.session.destroy();
      this.redirect('/auth/login/login');
   }
}