
'use strict';

import { SingleController } from 'loopar-env';
import { loopar } from "loopar-env";

export default class StripeController extends SingleController {
    constructor(props) {
        super(props);
    }

    async actionClientSecret() {
        const stripe = await loopar.getDocument("Stripe");

        return await this.success(await stripe.authorize());
    }
}