import FormContext from '/gui/document/form-context.js'
import { button, span } from "/components/elements.js";
import { DesignerForm } from "/components/common/designer-form.js";
import { ElementEditor } from "/components/common/element-editor.js";
import { loopar } from "/loopar.js";
import GlobalContext from "/components/global-context.js";

export default class DocumentForm extends FormContext {
   static contextType = GlobalContext;
   editingElement = false;

   constructor(props) {
      super(props);
   }

   render() {
      const { sidebarOption } = this.context;

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

               const className = el.element === "designer" && this.state.sidebarOption === "designer" ? "design true" : "";
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
      const sidebarOption = loopar.sidebarOption;
      return [
         button({
            className: "btn btn-secondary",
            type: "button",
            onClick: () => { this.toggleDesign() }
         }, [
            span({ className: `oi oi-brush mr-2 ${sidebarOption === "designer" ? "oi-eye" : "oi-brush"}` }),
            span(sidebarOption === "designer" ? "Preview" : "Design")
         ])
      ]
   }

   get sidebarContent() {
      const sidebarOption = (!this.editingElement && loopar.sidebarOption === "editor") ? "designer" : loopar.sidebarOption;
      loopar.sidebarSption = sidebarOption;

      const { meta = {} } = this.state;
      const data = meta.data || {};

      return [
         DesignerForm({
            className: ["designer", "preview"].includes(sidebarOption) ? "" : "d-none",
            data: data
         }),
         ElementEditor({
            className: "col " + (sidebarOption === "editor" ? "" : " d-none"),
            ref: self => {
               loopar.documentForm = this;
               this.elementEditor = self;
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
      this.editingElement = true;
      this.toggleDesign("editor");
      this.gui.toggleSidebar(true);
      this.elementEditor.editElement(element);
   }

   toggleDesign(sidebarOpt = null) {
      const { sidebarOption: current } = loopar;
      loopar.sidebarOption = sidebarOpt !== null ? sidebarOpt
         : ["preview", "editor"].includes(current) ? "designer"
            : "preview";

      this.setState({});
   }


   makeDocStructure() {
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

   get formValues() {
      return {
         ...super.formValues,
         //doc_structure: this.formFields.doc_structure.val()
      }
   }

   /*save() {
      this.make_doc_structure();
      super.save();
   }*/
}