import {BaseController, loopar} from 'loopar-env';

export default class DocumentController extends BaseController {
   constructor(props) {
      super(props);
   }

   async actionBulkDelete() {
      loopar.throw("You can't delete Documents in bulk");
   }
}