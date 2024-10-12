'use strict';

import AuthContext from '@context/auth-context';

export default class LoginForm extends AuthContext {
  async login() {
    console.log("Login");
    await this.send({
      action: 'login',
      error: () => {
        /*this.setState({
          logued: false
        });*/
        setTimeout(() => {
          this.setError("user_name", { message: "Invalid user name or password" });
          this.setError("password", { message: "Invalid user name or password" });
          
          this.get("login_action").hide();
          console.log(this.__REFS__);
          /*this.formFields.user_name.setState({ is_invalid: true });
          this.formFields.password.setState({ is_invalid: true });*/
        }, 10);
      },
    });
  }

  getFormValues() {
    return {
      user_name: this.getValue("user_name"),//) this.formFields.user_name.val(),
      password: this.getValue("password")//.password.val(),
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