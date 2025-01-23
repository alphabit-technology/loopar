
'use strict';

import {loopar, BaseController} from 'loopar';

export default class AuthController extends BaseController {
  freeActions = ['login', 'register', 'recovery_user', 'recovery_password'];
  actionsEnabled = ['login', 'logout'];
  client = "form";

  constructor(props){
    super(props);
  }

  async actionLogin() {
    return await this.#makeAction('Login', async (form) => {
      await form.login();
      return this.redirect('/desk/Desk/view');
    });
  }

  async actionLogout() {
    loopar.cookie.remove('auth_token');
    loopar.cookie.remove('logged');
    return this.redirect('/auth/login');
  }

  async actionRegister() {
    return await this.#makeAction('Register');
  }

  async actionRecoveryUser() {
    return await this.#makeAction('Recovery User');
  }

  async actionRecoveryPassword() {
    return await this.#makeAction('Recovery Password');
  }

  async #makeAction(form, fn) {
    form = await loopar.newDocument(form, this.data);
    if (this.hasData()) {
      return await fn(form);
    } else {
      return await this.render(await form.__data__());
    }
  }
}