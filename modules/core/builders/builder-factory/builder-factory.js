
'use strict';
import Entity from "../../entities/entity/entity.js";
import { BaseDocument, documentManage, fileManage, loopar, MetaComponents } from "loopar";
import { Helpers } from "loopar";

export default class BuilderFactory extends Entity {
  type = "Builder Factory";

  constructor(props) {
    console.log(["Builder Factory", props]);
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module, "builders");
  }

  async makeFiles() {
    const documentPath = await this.documentPath();
    const clientPath = await this.clientPath();

    /*Entity Model*/
    await fileManage.makeClass(documentPath, this.name, {
      IMPORTS: {
        'Entity': '../../../../../loopar/modules/core/builders/builder-factory/builder-factory.js',
      },
      EXTENDS: 'Entity'
    });
    /*Entity Model*/

    /*Entity Controller*/
    const extendController = "BaseController";
    await fileManage.makeClass(documentPath, `${this.name}Controller`, {
      IMPORTS: {
        [extendController]: 'loopar',
      },
      EXTENDS: extendController
    });
    /*Entity Controller*/

    const makeView = async (view, context = view) => {
      const importContext = `${Helpers.Capitalize(context)}Context`;
      const viewName = this.name + Helpers.Capitalize(view);

      await fileManage.makeClass(clientPath, viewName, {
        IMPORTS: {
          [importContext]: `@context/${context}-context`
        },
        EXTENDS: importContext
      }, 'default', "jsx");
    }

    for (const context of ["list", "form"]) {
      await makeView(context);
    }
  }
}