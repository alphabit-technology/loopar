'use strict'

import { BaseDocument, loopar } from "loopar";

export default class Login extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async login() {
    const user = await loopar.getUser(this.user_name);
    const passwordHash = loopar.hash(this.password);

    return new Promise(resolve => {
      if (user &&
        !(user.disabled && user.name !== 'Administrator') &&
        (this.user_name === user.name || this.user_name === user.email) &&
        passwordHash === user.password
      ) {
        loopar.auth.login(user);
        resolve();
      } else {
        loopar.auth.killSession();

        loopar.throw({
          code: 401,
          trow: 'Login Error',
          message: 'Invalid user or password'
        });
      }
    });
  }

  async logout() {
    loopar.auth.killSession();
  }
}