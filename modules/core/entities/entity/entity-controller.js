import { BaseController, loopar } from 'loopar';

export default class EntityController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionBulkDelete() {
    loopar.throw("You can't delete Entities in bulk");
  }

  async actionSetTailwind() {
    if (this.hasData()) {
      const { to_element, classes } = this.data;

      if (classes) {
        loopar.setTailwind(to_element, decodeURIComponent(classes));
        return this.success("Tailwind set successfully");
      }
    }
  }
}