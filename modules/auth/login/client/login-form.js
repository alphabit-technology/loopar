'use strict';

import AuthContext from '/gui/document/auth-context.js';

export default class LoginForm extends AuthContext {
    constructor(props){
        super(props);
    }

    render() {
        return super.render();
    }

    async login() {
        await this.send({action: 'login'});
    }

    get form_values() {
        return {
            user_name: this.form_fields.user_name.val(),
            password: this.form_fields.password.val(),
        }
    }
}