'use strict';

import FormContext from '/gui/document/form-context.js'

export default class AppForm extends FormContext {
   web_app_settings = {}; /** @type {FormContext} will be set on load document*/

   constructor(props) {
      super(props);
   }

   render() {
      return super.render();
   }

   componentDidMount(){
      super.componentDidMount();
      const type = this.get_field('type');
      const has_footer = this.get_field('has_footer');
      const has_copyrigth = this.get_field('has_copyright');

      type.onChange = (e) => {
         this.web_app_settings[e.target.value === 'Web App' ? 'show' : 'hide']();
      }

      has_footer.onChange = (e) => {
         this.get_field("footer")[e.target.checked ? 'show' : 'hide']();
      }

      has_copyrigth.onChange = (e) => {
         this.get_field("copyright")[e.target.checked ? 'show' : 'hide']();
      }

      type.onChange({target: {value: type.val()}});
      has_footer.onChange({target: {checked: has_footer.val()}});
      has_copyrigth.onChange({target: {checked: has_copyrigth.val()}});

   }
   /*async onLoad() {
      this.get_field('autor').disable();
      this.get_field('version').disable();
      console.log('onLoad', this);
   }

   validate(){
      const git_repo = this.get_field('git_repo').val();

      if(this.__IS_NEW__ && git_repo){
         const regex = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})((\.git)?)$/);
         if(!regex.test(git_repo)){
            this.get_field('git_repo').error('Invalid GitHub URL');
            loopar.throw('Invalid GitHub URL');
         }
      }else{
         return super.validate();
      }
   }*/
}