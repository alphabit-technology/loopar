
import Auth from '/gui/document/auth-context.js';

export default class RecoveryPassword extends Auth {
   constructor(props) {
      super(props).implements(this);
   }

   onLogin() {
      console.log("Login");
      this.trigger("onLogin");
   }

   onSave() {
      console.log("sub onSave");
   }

   onShow() {
      console.log("sub Show");
   }

   onLoad() {
      //this.wrapper.css("background-color", "red");
      console.log("sub Load");
   }
}

/*if (request_data) {
    new RecoveryPassword(request_data);
}*/