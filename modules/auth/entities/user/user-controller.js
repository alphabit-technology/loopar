'use strict'

import { BaseController, loopar } from "loopar";

export default class UserController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionUpdate() {
    this.context ??= 'form';
    const document = await loopar.getDocument("User", this.name, this.hasData() ? this.data : null);

    if (!this.hasData()) {
      document.password = document.protectedPassword;
      document.confirm_password = document.protectedPassword;
    }
    return await super.actionUpdate(document);
    /*if (this.hasData()) {
       await document.save();
       return this.success(`Document ${document.name} saved successfully`);
    } else {
       //document.password = document.protectedPassword;
       //document.confirm_password = document.protectedPassword;

       Object.assign(this.response, await document.__data__());
       this.response.app = 'form';

       return this.render(this.response);
    }*/
  }

  actionLogout() {
    loopar.session.destroy();
    this.redirect('/login/login');
  }
}