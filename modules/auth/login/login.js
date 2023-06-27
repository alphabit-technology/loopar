'use strict'

import {BaseDocument, loopar} from "loopar-env";

export default class Login extends BaseDocument {
   constructor(props) {
      super(props);
   }

   async login() {
      const user = await loopar.get_user(this.user_name);
      const password_hash = loopar.hash(this.password);

      return new Promise(resolve => {
         if (user && !(user.disabled && user.name !== 'Administrator') && (this.user_name === user.name || this.user_name === user.email) && password_hash === user.password) {
            loopar.session.set('user', {
               name: user.name,
               email: user.email,
               avatar: user.name.substring(0, 1).toUpperCase(),
               profile_picture: user.profile_picture,
            }, resolve());
         } else {
            loopar.session.delete("user");
            loopar.throw({
               trow: 'Login Error',
               message: 'Invalid user or password'
            });
         }
      });
   }
}