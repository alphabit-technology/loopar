import FormContext from '$context/list-context';

export default class Form extends FormContext {
   register() {
      super.send('register');
   }
}