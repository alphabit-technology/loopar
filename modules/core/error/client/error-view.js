
'use strict';

import ViewContext from '/gui/document/view-context.js';
import { div, h1, image, p, a, i} from '/components/elements.js';

export default class ErrorView extends ViewContext {
    constructor(props){
        super(props);
    }

    render() {
        const data = this.props.meta.__DOCUMENT__;
        console.log(this.props)
        /*
        <div class="wrapper">
          <!-- .empty-state -->
          <div class="empty-state">
            <!-- .empty-state-container -->
            <div class="empty-state-container">
              <div class="state-figure">
                <img class="img-fluid" src="assets/images/illustration/img-2.svg" alt="" style="max-width: 320px">
              </div>
              <h3 class="state-header"> Page Not found! </h3>
              <p class="state-description lead text-muted"> Sorry, we've misplaced that URL or it's pointing to something that doesn't exist. </p>
              <div class="state-action">
                <a href="/" class="btn btn-lg btn-light"><i class="fa fa-angle-right"></i> Go Back</a>
              </div>
            </div><!-- /.empty-state-container -->
          </div><!-- /.empty-state -->
        </div>*/
        return [
            div({ className: "wrapper"}, [
                div({className: "empty-state"}, [
                    div({className: "empty-state-container"}, [
                        div({className: "state-figure"}, [
                            image({className: "img-fluid", src: `/assets/images/illustration/${data.error || '500'}.svg`, alt: "", style: {maxWidth: 320}})
                        ]),
                        h1({className: "state-header"}, data.title || "Oops! Something went wrong"),
                        p({className: "state-description lead text-muted"}, data.message || "We are sorry, but it seems that an error has occurred. Please try again later."),
                        div({className: "state-action"}, [
                            a({href: "/", className: "btn btn-lg btn-light"}, [
                                i({className: "fa fa-angle-right"}),
                                "Go Back"
                            ])
                        ])
                    ])
                ])
            ])
        ]
    }
}