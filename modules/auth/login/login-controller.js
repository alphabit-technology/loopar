'use strict'

import {BaseController, loopar} from "loopar-env";

export default class LoginController extends BaseController {
   workspace = 'auth';
   default_action = 'login';
   has_sidebar = false;

   free_actions = ['login', 'register', 'recovery_user', 'recovery_password'];
   actions_enabled = ['login', 'logout'];

   constructor(props) {
      super(props);

      /*if(!['login', 'logout'].includes(this.action)){
         loopar.throw("Action not valid");
         //this.layout = 'login';
      }*/
   }

   async action_login() {
      this.client = "form";
      if (this.has_data()) {
         const form = await loopar.new_document("Login", this.data);

         form.login().then(() => {
            this.redirect('/desk');
         });
      } else {
         await this.#make_action('Login');
      }
   }

   action_logout() {
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

   async action_register() {
      await this.#make_action('Register');
   }

   async action_recovery_user() {
      await this.#make_action('Recovery User');
   }

   async action_recovery_password() {
      await this.#make_action('Recovery Password');
   }

   async #make_action(form) {
      this.document_name = form;
      const _form = await loopar.new_document(form);

      await this.render(await _form.__data__());
   }
}