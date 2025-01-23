'use strict'

import { BaseDocument, loopar } from "loopar";
import jwt from 'jsonwebtoken';


export default class Login extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async login() {
    const user = await loopar.getUser(this.user_name);
    const passwordHash = loopar.hash(this.password);

    return new Promise(resolve => {
      if (user && !(user.disabled && user.name !== 'Administrator') && (this.user_name === user.name || this.user_name === user.email) && passwordHash === user.password) {
        
        const userData = {
          name: user.name,
          email: user.email,
          avatar: user.name.substring(0, 1).toUpperCase(),
          profile_picture: user.profile_picture,
        }

        const token = jwt.sign(userData, 'user-auth', { expiresIn: '1d' });
        loopar.cookie.set('auth_token', token, { httpOnly: true });
        loopar.cookie.set('logged', true);
        
        resolve();
      } else {
        loopar.cookie.remove('auth_token');
        loopar.throw({
          code: 401,
          trow: 'Login Error',
          message: 'Invalid user or password'
        });
      }
    });
  }
}