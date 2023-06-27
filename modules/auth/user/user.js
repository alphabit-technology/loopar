'use strict'

import {BaseDocument, loopar} from "loopar-env";

export default class User extends BaseDocument {
   constructor(props) {
      super(props);
   }

   /**function validate password strong */
   validate_password_strong() {
      const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
      if (!strongRegex.test(this.password)) {
         //loopar.throw('Your password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number and one special character');
      }
   }

   async validate_name_user() {
      const regex = new RegExp("^[a-zA-Z ]+$");

      if (!regex.test(this.name)) {
         loopar.throw('Your name must be at least 3 characters long');
      }

      /**Test "Administrator" user Name */
      if (!loopar.installing && this.__IS_NEW__ && this.name === 'Administrator') {
         loopar.throw('User name "Administrator" is not allowed');
      }

      /**Test Name */
      if (await loopar.db.get_value('User', 'id', this.name, this.id)) {
         loopar.throw(`The name <strong>${this.name}</strong> is invalid`);
      }

      /**Test Email */
      if (await loopar.db.get_value('User', 'id', {'=': {email: this.email}}, this.id)) {
         loopar.throw(`The email <strong>${this.email}</strong> is invalid`);
      }
   }

   async validate() {
      if (this.disabled && this.name === 'Administrator') {
         loopar.throw('The "Administrator" user cannot be disabled.');
      }

      await super.validate();
      await this.validate_name_user();
      this.validate_password_strong();
   }

   async save(){
      const password = this.password;
      const confirm_password = this.confirm_password;

      if(this.__IS_NEW__){
         this.password = loopar.hash(password);
         this.confirm_password = loopar.hash(confirm_password);
      }else{
         const user = await loopar.get_document('User', this.name);

         if(password && password.length > 0 && password !== this.protected_password){
            this.password = loopar.hash(password);
            this.confirm_password = loopar.hash(confirm_password);
         }else{
            this.password = user.password;
            this.confirm_password = user.confirm_password;
         }
      }

      if(password !== confirm_password){
         loopar.throw('The password and confirmation password do not match.');
      }

      await super.save();
   }

   async delete(){
      if(this.name === 'Administrator'){
         loopar.throw('The "Administrator" user cannot be deleted.');
         return;
      }

      await super.delete();
   }
}