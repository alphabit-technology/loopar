
'use strict';

import {BaseDocument} from 'loopar-env';
import StripeClass from 'stripe';

export default class Stripe extends BaseDocument {
    constructor(props){
        super(props);

        this.stripe = StripeClass(this.secret_key);
    }
    
    async authorize() {
        return {
            client_secret: await this.clientSecret(),
            publishable_key: this.public_key,
        }
    }

    async clientSecret() {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: 1000,
            currency: 'usd',
        });

        return paymentIntent.client_secret;
    }
}