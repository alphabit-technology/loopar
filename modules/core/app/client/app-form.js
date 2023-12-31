'use strict';

import FormContext from '/gui/document/form-context.js';
import {button, div, i, label} from '/components/elements.js';
import { loopar } from '/loopar.js';

export default class AppForm extends FormContext {
   /**
    * @type {FormField} is a field of the form, described in the meta.json file
    */
   web_app_settings = {}; /** @type {FormContext} will be set on load document*/

   constructor(props) {
      super(props);
   }

   get webAppSettigs () {
      return this.web_app_settings;
   }

   render() {
      return super.render();
   }

   setCustomActions() {
      super.setCustomActions();

      this.setCustomAction('syncInstaller', button({
         className: "btn btn-secondary",
         type: "button",
         onClick: () => {
            loopar.method("App Manager", "syncInstaller", this.getValue('name'));
         }
      }, [
         i({ className: "fa fa-sync mr-2" }),
         "Sync Installer"
      ]));
   }

   componentDidMount(){
      super.componentDidMount();
      this.setCustomActions();

      const type = this.getField('type');
      const hasFooter = this.getField('has_footer');
      const hasCopyrigth = this.getField('has_copyright');

      type.onChange = (e) => {
         this.webAppSettigs[e.target.value === 'Web App' ? 'show' : 'hide']();
      }

      hasFooter.onChange = (e) => {
         this.getField("footer")[e.target.checked ? 'show' : 'hide']();
      }

      hasCopyrigth.onChange = (e) => {
         this.getField("copyright")[e.target.checked ? 'show' : 'hide']();
      }

      type.onChange({target: {value: type.val()}});
      hasFooter.onChange({target: {checked: hasFooter.val()}});
      hasCopyrigth.onChange({target: {checked: hasCopyrigth.val()}});

   }
   /*async onLoad() {
      this.getField('autor').disable();
      this.getField('version').disable();
      console.log('onLoad', this);
   }

   validate(){
      const git_repo = this.getField('git_repo').val();

      if(this.__IS_NEW__ && git_repo){
         const regex = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})((\.git)?)$/);
         if(!regex.test(git_repo)){
            this.getField('git_repo').error('Invalid GitHub URL');
            loopar.throw('Invalid GitHub URL');
         }
      }else{
         return super.validate();
      }
   }*/
}