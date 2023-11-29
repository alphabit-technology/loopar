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
                    this.formFields.user_name.setState({ is_invalid: true });
                    this.formFields.password.setState({ is_invalid: true });
                }, 10);
            },
        });
    }

    get formValues() {
        return {
            user_name: this.formFields.user_name.val(),
            password: this.formFields.password.val(),
        }
    }

    componentDidMount(){
        super.componentDidMount();
        this.makeEvents();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
        if (Object.keys(this.formFields.user_name.attrs).length == 0){
            this.makeEvents();
        }
    }

    makeEvents(){
        super.makeEvents();

        this.formFields.user_name.on('keyUp', e => {
            if (e.keyCode == 13) {
                if (e.target.value.length == 0) {
                    this.formFields.password.focus();
                } else if (this.formFields.password.val().length == 0) {
                    this.formFields.password.focus();
                } else {
                    this.login();
                }
            }
        });

        this.formFields.password.on('keyUp', e => {
            if (e.keyCode == 13) {
                if (e.target.value.length == 0 || this.formFields.user_name.val().length == 0) {
                    this.formFields.user_name.focus();
                } else {
                    this.login();
                }
            }
        });
    }
}