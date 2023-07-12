'use strict';

import { FileBrowser } from '/components/tools/file-browser.js';
import ListContext from '/gui/document/list-context.js';
import { button, i, File_uploader } from '/components/elements.js';
import { element_manage } from '/components/element-manage.js';
import { loopar } from '/loopar.js';
import { fileManager } from "/components/tools/file-manager.js";
import { FilePreview } from "/components//base/file-preview.js";


export default class FileManagerList extends ListContext {
   //has_header = false;
   renderGrid = true;
   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         uploading: false,
      };
   }

   file(file) {
      return fileManager.getMappedFiles(file);
   }

   gridTemplate(row, action) {
      row.extention = row.name.split('.').pop();
      
      const file = this.file([row])[0]

      
      return [

         FilePreview({
            //key: element_manage.getUniqueKey(),
            file: file,
            //selected: file.selected,
         })
         /*div({ className: "card-header border-0" }, [
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
            a({ className: `tile tile-lg bg-${loopar.bg_color(row.name)} mb-2`, href: `/${row.module}/${row.name}/${action}`, element: `element-${action}` }, avatar(row.name)),
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
            }, Capitalize(action === 'list' ? 'View List' : action)),
            a({
               className: "card-footer-item card-footer-item-bordered card-link",
               href: `/${row.module}/${row.name}/create`,
               element: "add",
               style: row.is_single ? { display: 'none' } : {}
            }, "Add")
         ])*/
      ];
   }

   render(){
      this.setCustomActions();
      return super.render([
         this.state.uploading ? File_uploader({
            meta: {
               data: {
                  name: "file",
                  label: "File",
                  placeholder: "Select file",
                  accept: "*",
                  multiple: true,
               }
            },
            inModal: true,
            onUpload: () => {
               loopar.navigate("list");
            },
            onClose: () => {
               this.setState({ uploading: false });
            },
         }) : null,
      ]);
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.meta.rows !== this.props.meta.rows) {
         this.setState({});
      }
   }

   /*render() {
      return super.render([
         FileBrowser({
            has_title: true,
            files: this.props.meta.rows,
         })
      ]);
   }*/

   primaryAction() {
      return button({
         className: "btn btn-primary",
         type: "button",
         onClick: (e) => {
            e.preventDefault();
            this.setState({ uploading: true });
         }
      }, [
         i({ className: "fa fa-fw fa-plus" }),
         " Upload"
      ])
   }
}