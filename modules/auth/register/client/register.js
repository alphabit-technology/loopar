import FormContext from '/gui/document/form-context.js';

export default class Form extends FormContext {
   constructor(props) {
      super(props);
   }

   register() {
      super.send('register');
   }
}