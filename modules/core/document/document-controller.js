import { BaseController, loopar } from 'loopar';

export default class DocumentController extends BaseController {
   constructor(props) {
      super(props);
   }

   async actionBulkDelete() {
      loopar.throw("You can't delete Documents in bulk");
   }

   async actionSetTailwind() {
      if(this.hasData()){
         const {to_element, classes} = this.data;

         console.log(["Setting tailwind", to_element, classes]);
         if(classes){
            loopar.setTailwind(to_element, decodeURIComponent(classes));
            return this.success("Tailwind set successfully");
         }
      }
   }
}