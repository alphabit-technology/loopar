
'use strict';

import ViewContext from '$context/view-context'

export default class NotFoundView extends ViewContext {
   has_header = false;
   has_sidebar = false;
   constructor(props) {
      super(props);
   }

   /*render(){
       //console.log("rendering not found view");
       return [
          div({className: "wrapper"}, [
             div({className: "empty-state"}, [
                div({className: "empty-state-container"}, [
                   div({className: "state-figure"},
                      image({className: "img-fluid", src: "https://solen.ca/themes/storefront/public/images/404.svg", alt: "", style: {maxWidth: 320}})
                   ),
                   h3({className: "state-header"}, "Page Not found!"),
                   p({className: "state-description lead text-muted"}, "Sorry, we've misplaced that URL or it's pointing to something that doesn't exist."),
                   div({className: "state-action"},
                      a({href: "/", className: "btn btn-lg btn-light"}, [
                         i({className: "fa fa-angle-right"}), "Go Back"
                      ])
                   )
                ])
             ])
          ])
       ];
   }*/
}