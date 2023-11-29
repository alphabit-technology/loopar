import { div, span, button, i, a, h5 } from '/components/elements.js';
import ListContext from '/gui/document/list-context.js'
import { loopar } from "/loopar.js";

export default class DocumentList extends ListContext {
   cardSize = 230;
   hiddenColumns = ["is_single"];
   constructor(props) {
      super(props);
   }

   onSave() {

   }

   onShow() {
      super.onShow();
   }

   onLoad() {

   }

   gridTemplate(row, action) {
      return [
         div({ className: "card-header border-0" }, [
            div({ className: "d-flex justify-content-between align-items-center" }, [
               span({ className: "badge bg-muted", title: "Enabled" }, [
                  span({ className: "sr-only" }, "Enabled"),
                  i({ className: "fa fa-fw fa-check-circle text-teal" }, "i")
               ]),
               div({ className: "dropdown", style: { display: 'none' } }, [
                  button({ className: "btn btn-icon btn-light", type: "button", "data-toggle": "dropdown", "aria-expanded": "false" }, [
                     i({ className: "fa fa-ellipsis-v" })
                  ]),
                  div({ className: "dropdown-menu dropdown-menu-right" }, [
                     div({ className: "dropdown-arrow" }),
                     a({ className: "dropdown-item", href: "#", element: "view-list" }, "View List"),
                     a({ className: "dropdown-item", href: "#", element: "add-document" }, `Add ${row.name}`),
                     a({ className: "dropdown-item", href: "#", element: "edit-document" }, `Edit ${row.name}`),
                     a({ className: "dropdown-item", href: "#", element: "delete-document" }, `Remove ${row.name}`)
                  ])
               ])
            ])
         ]),
         div({ className: "card-body text-center" }, [
            a({
               className: `tile tile-lg bg-${loopar.bgColor(row.name)} mb-2`, 
               href: `/${row.module}/${row.name}/${action}`, 
               //element: `element-${action}`
            }, loopar.utils.avatar(row.name)),
            h5({ className: "card-title" }, [
               a({ className: "card-title", href: "#" }, row.name)
            ]),
            div({ className: "my-3" }, [
               div({ className: "avatar-group" })
            ])
         ]),
         div({ className: "card-footer" }, [
            a({
               className: "card-footer-item card-footer-item-bordered card-link",
               href: `/${row.module}/${row.name}/${action}`,
               element: "view_list"
            }, loopar.utils.Capitalize(action === 'list' ? 'View List' : action)),
            a({
               className: "card-footer-item card-footer-item-bordered card-link",
               href: `/${row.module}/${row.name}/create`,
               element: "add",
               style: row.is_single ? { display: 'none' } : {}
            }, "Add")
         ])
      ];
   }
}