
'use strict';

import {SingleController} from 'loopar-env';
import { loopar } from "loopar-env";

export default class StripeController extends SingleController {
    constructor(props){
        super(props);
    }

    async action_clientSecret() {
        const stripe = await loopar.get_document("Stripe");

        return await this.success(await stripe.authorize());
    }
}