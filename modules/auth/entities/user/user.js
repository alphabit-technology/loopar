'use strict'

import { BaseDocument, loopar } from "loopar";

export default class User extends BaseDocument {
  constructor(props) {
    super(props);
  }

  /**function validate password strong */
  validatePasswordStrong() {
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    if (!strongRegex.test(this.password)) {
      //loopar.throw('Your password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number and one special character');
    }
  }

  async validateUserName() {
    const regex = new RegExp("^[a-zA-Z ]+$");

    if (!regex.test(this.name)) {
      loopar.throw('Your name must be at least 3 characters long');
    }

    /**Test "Administrator" user Name */
    if (!loopar.installing && this.__IS_NEW__ && this.name === 'Administrator') {
      loopar.throw('User name "Administrator" is not allowed');
    }

    /**Test Name */
    if (await loopar.db.getValue('User', 'id', this.name, { distinctToId: this.id })) {
      loopar.throw(`The name <strong>${this.name}</strong> is invalid`);
    }

    /**Test Email */
    if (await loopar.db.getValue('User', 'id', {email: this.email}, { distinctToId: this.id })) {
      loopar.throw(`The email <strong>${this.email}</strong> is invalid`);
    }
  }

  async validate() {
    if (this.disabled && this.name === 'Administrator') {
      loopar.throw('The "Administrator" user cannot be disabled.');
    }

    if(this.disabled && this.name == loopar.auth.authUser()?.name) {
      loopar.throw('You cannot disable your own account.');
    }

    await super.validate();
    await this.validateUserName();
    this.validatePasswordStrong();
  }

  async save() {
    const password = this.password;
    const confirmPassword = this.confirm_password;

    console.log(["User", password]);
    if (this.__IS_NEW__) {
      console.log(['New User']);
      this.password = loopar.hash(password);
      this.confirm_password = loopar.hash(confirmPassword);
    } else {
      const user = await loopar.getDocument('User', this.name);

      if (password && password.length > 0 && password !== this.protectedPassword) {
        console.log(['Update Password', password, loopar.hash(password)]);
        this.password = loopar.hash(password);
        this.confirm_password = loopar.hash(confirmPassword);
      } else {
        this.password = user.password;
        this.confirm_password = user.confirm_password;
      }
    }

    if (password !== confirmPassword) {
      loopar.throw('The password and confirmation password do not match.');
    }

    await super.save(arguments[0]);
  }

  async delete() {
    if (this.name === 'Administrator') {
      loopar.throw('The "Administrator" user cannot be deleted.');
      return;
    }

    await super.delete();
  }
}