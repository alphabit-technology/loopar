'use strict'

import { BaseController, loopar } from "loopar";

export default class LoginController extends BaseController {
  workspace = 'auth';
  defaultAction = 'login';
  hasSidebar = false;

  freeActions = ['login', 'register', 'recovery_user', 'recovery_password'];
  actionsEnabled = ['login', 'logout'];

  constructor(props) {
    super(props);

    /*if(!['login', 'logout'].includes(this.action)){
       loopar.throw("Action not valid");
       //this.layout = 'login';
    }*/
  }

  async actionLogin() {
    this.client = "form";
    if (this.hasData()) {
      const form = await loopar.newDocument("Login", this.data);

      form.login().then(() => {
        this.redirect('/desk');
      });
    } else {
      return await this.#makeAction('Login');
    }
  }

  actionLogout() {
    const [req, res] = [this.req, this.res];

    req.session.user = null
    req.session.save(function (err) {
      if (err) next(err)

      req.session.regenerate(function (err) {
        if (err) next(err)
        res.redirect('/auth/login/login');
      });
    });
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

  async #makeAction(form) {
    this.documentName = form;
    const _form = await loopar.newDocument(form);

    return await this.render(await _form.__data__());
  }
}