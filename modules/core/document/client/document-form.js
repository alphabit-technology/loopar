import FormContext from '/gui/document/form-context.js'
import { button, span } from "/components/elements.js";
import { DesignerForm } from "/components/common/designer-form.js";
import { ElementEditor } from "/components/common/element-editor.js";
import { loopar } from "/loopar.js";
import GlobalContext from "/components/global-context.js";

export default class DocumentForm extends FormContext {
   static contextType = GlobalContext;
   editing_element = false;

   constructor(props) {
      super(props);
   }

   render() {
      const { sidebar_option } = this.context;

      return super.render();
   }

   /*render(){
      const meta = this.props.meta;
      return super.render([
         DeskGUI({
            meta: meta,
            ref: gui => this.gui = gui,
            has_sidebar: true,
            has_header: true,
            base: this,
            sidebarHeaderContent: this.sidebarHeaderContent,
            sidebarContent: this.sidebarContent
         }, [
            ...meta.__DOCTYPE__.STRUCTURE.map(el => {
               el.element = el.data.name === "doc_designer" ? "designer" : el.element;

               const className = el.element === "designer" && this.state.sidebar_option === "designer" ? "design true" : "";
               return Element(el.element, {
                  className: "tesst",
                  formRef: this,
                  meta: {
                     ...el
                  },
               })
            })
         ])
      ]);
   }*/

   get sidebarHeaderContent() {
      const sidebar_option = loopar.sidebar_option;
      return [
         button({
            className: "btn btn-secondary",
            type: "button",
            onClick: () => { this.toggleDesign() }
         }, [
            span({ className: `oi oi-brush mr-2 ${sidebar_option === "designer" ? "oi-eye" : "oi-brush"}` }),
            span(sidebar_option === "designer" ? "Preview" : "Design")
         ])
      ]
   }

   get sidebarContent() {
      const sidebar_option = (!this.editing_element && loopar.sidebar_option === "editor") ? "designer" : loopar.sidebar_option;
      loopar.sidebar_option = sidebar_option;

      const { meta = {} } = this.state;
      const data = meta.data || {};

      return [
         DesignerForm({
            className: ["designer", "preview"].includes(sidebar_option) ? "" : "d-none",
            data: data,
            app: this
         }),
         ElementEditor({
            className: "col " + (sidebar_option === "editor" ? "" : " d-none"),
            ref: self => {
               loopar.document_form = this;
               this.element_editor = self;
               //this.load_document();
            }
         })
      ]
   }

   onLoad() {
      /*this.get_field('type').on('change', () => {
         console.log('type changed');
      });*/
   }

   /*load_document() {
      super.load_document();
   }*/

   editElement(element) {
      this.editing_element = true;
      this.toggleDesign("editor");
      this.gui.toggleSidebar(true);
      this.element_editor.editElement(element);

   }

   toggleDesign(sidebarOpt = null) {
      const { sidebar_option: current } = loopar;
      loopar.sidebar_option = sidebarOpt !== null ? sidebarOpt
         : ["preview", "editor"].includes(current) ? "designer"
            : "preview";

      this.setState({});
   }


   make_doc_structure() {
      /*const elements = (base) => {
         return base.elements_dict.map(e => {
            const el = base.elements_list[e.data.name];

            if(!el) return null;

            return {
               element: el.element,
               is_writable: el.is_writable,
               data: el.data,
               elements: elements(el)
            }
         }).filter(e => e !== null);
      }

      const els = elements(this.doc_designer, this.doc_designer);

      console.log(["doc_structure", els]);

      this.doc_designer && this.doc_designer.set_elements(els);



      this.set_value("doc_structure", JSON.stringify(elements(this.doc_designer)));*/
   }

   get form_values() {
      return {
         ...super.form_values,
         //doc_structure: this.form_fields.doc_structure.val()
      }
   }

   /*save() {
      this.make_doc_structure();
      super.save();
   }*/
}