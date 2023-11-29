'use strict';

import ListContext from '/gui/document/list-context.js';
import { button, i, FileUploader, span, div, a } from '/components/elements.js';
import { loopar } from '/loopar.js';
import { fileManager } from "/components/tools/file-manager.js";
import { FilePreview } from "/components/base/file-preview.js";


export default class FileManagerList extends ListContext {
   renderGrid = true;
   hiddenColumns = ["id", "size", "type", "src", "previewSrc"];
   filesRefs = {};

   constructor(props) {
      super(props);

      typeof props.onlyGrid !== "undefined" && (this.onlyGrid = props.onlyGrid);
      this.state = {
         ...this.state,
         uploading: false,
      };
   }

   file(file) {
      return fileManager.getMappedFiles(file);
   }

   get mappedColumns() {
      return [
         {
            data: {
               label: "Name",
               name: "name",
               value: (row) => {
                  const type = fileManager.getFileType(row);
                  const icon = fileManager.getRenderedFileIcon(type);
                  return [
                     div({className: "media align-items-center"}, [
                        a({ className: "mr-2"}, [
                           icon
                        ]),
                        div({className: "media-body"}, [
                           a({
                              href: `update?documentName=${row.name}`
                           }, row.name),
                           span({className: "d-block text-muted"}, [
                              fileManager.getFileSize(row.size)
                           ])
                        ])
                     ])
                  ]
               }
            }
         }
      ];
   }

   get multiple() {
      return this.props.multiple !== 0;
   }

   gridTemplate(row, action, grid) {
      row.extention = row.name.split('.').pop();
      const file = this.file([row])[0];

      return [
         FilePreview({
            data: row,
            file: file,
            key: ``,
            onSelect: (src) => {
               this.props.onSelect && this.props.onSelect(src);
            },
            accept: this.props.accept || "/*",
            multiple: this.props.multiple !== 0,
            docRef: this,
            grid,
            ref: (ref) => {
               this.filesRefs[row.name] = ref;
            }
         })
      ];
   }

   render(){
      return super.render([
         this.state.uploading ? FileUploader({
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

   componentDidMount() {
      this.setCustomActions();
   }

   getSelectedFiles() {
      console.log(this.grid?.selectedRows);
      return this.grid?.selectedRows || [];
   }

   getFiles() {
      return this.props.meta.rows;
   }

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