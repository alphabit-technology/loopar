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
        await this.send({
            action: 'login',
            error: () => {
                this.setState({
                    logued: false
                });
                setTimeout(() => {
                    this.form_fields.user_name.setState({ is_invalid: true });
                    this.form_fields.password.setState({ is_invalid: true });
                }, 10);
            },
        });
    }

    get form_values() {
        return {
            user_name: this.form_fields.user_name.val(),
            password: this.form_fields.password.val(),
        }
    }

    componentDidMount(){
        super.componentDidMount();
        this.makeEvents();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
        if (Object.keys(this.form_fields.user_name.attrs).length == 0){
            this.makeEvents();
        }
    }

    makeEvents(){
        super.makeEvents();

        this.form_fields.user_name.on('keyUp', e => {
            if (e.keyCode == 13) {
                if (e.target.value.length == 0) {
                    this.form_fields.password.focus();
                } else if (this.form_fields.password.val().length == 0) {
                    this.form_fields.password.focus();
                } else {
                    this.login();
                }
            }
        });

        this.form_fields.password.on('keyUp', e => {
            if (e.keyCode == 13) {
                if (e.target.value.length == 0 || this.form_fields.user_name.val().length == 0) {
                    this.form_fields.user_name.focus();
                } else {
                    this.login();
                }
            }
        });
    }
}