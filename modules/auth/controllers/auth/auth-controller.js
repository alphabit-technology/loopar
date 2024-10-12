
'use strict';

import {loopar, BaseController} from 'loopar';

export default class AuthController extends BaseController {
  constructor(props){
    super(props);
  }

  async actionLogin() {
    this.client = "form";
    if (this.hasData()) {
      const form = await loopar.newDocument("Login", this.data);

      await form.login();

      return this.redirect('/desk');
    } else {
      return await this.#makeAction('Login');
    }
  }

  actionLogout() {
    loopar.session.destroy();
    return this.redirect('/auth/login');
  }

  async #makeAction(form) {
    this.name = form;
    const _form = await loopar.newDocument(form);

    return await this.render(await _form.__data__());
  }
}