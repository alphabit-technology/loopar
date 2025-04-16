'use strict';

import AuthContext from '@context/auth-context';

export default class LoginForm extends AuthContext {
  async login() {
    await this.send({
      action: 'login',
      error: () => {
        setTimeout(() => {
          this.setError("user_name", { message: "Invalid user name or password" });
          this.setError("password", { message: "Invalid user name or password" });
          
          this.get("login_action").hide();
        }, 10);
      },
    });
  }

  getFormValues() {
    return {
      user_name: this.user_name,
      password: this.password,
    }
  }

  /*componentDidMount() {
    super.componentDidMount();
    this.makeEvents();
  }*/

  makeEvents() {
    //super.makeEvents();

    /*this.formFields.user_name.on('keyUp', e => {
      if (e.keyCode == 13) {
        if (e.target.value.length == 0) {
          this.formFields.password.focus();
        } else if (this.formFields.password.val().length == 0) {
          this.formFields.password.focus();
        } else {
          this.login();
        }
      }
    });

    this.formFields.password.on('keyUp', e => {
      if (e.keyCode == 13) {
        if (e.target.value.length == 0 || this.formFields.user_name.val().length == 0) {
          this.formFields.user_name.focus();
        } else {
          this.login();
        }
      }
    });*/
  }
}