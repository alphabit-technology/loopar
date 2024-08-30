
'use strict';
import Entity from "../entity/entity.js";
import { BaseDocument, documentManage, fileManage, loopar, MetaComponents } from "loopar";
import { Helpers } from "loopar";

export default class BuilderFactory extends Entity {
  type = "Builder";

  constructor(props) {
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module, "builders");
  }

  /*async save() {
    const data = await this.values();
    const newEntity = await loopar.getDocument("Entity", "Entity", data);

    console.log(["ON save Builder", data])
    return true;
    //return await newEntity.save();
  }*/

  async makeViews() {
    const documentPath = await this.documentPath();
    const clientPath = await this.clientPath();

    /*Entity Model*/
    await fileManage.makeClass(documentPath, this.name, {
      IMPORTS: {
        'Entity': '../../../../../loopar/modules/core/entities/entity/entity.js',
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

  async getList1({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
    const pagination = {
      page: loopar.session.get("Entity_page") || 1,
      pageSize: 10,
      totalPages: 4,
      totalRecords: 1,
      sortBy: "id",
      sortOrder: "asc",
      __ENTITY__: "Entity"
    };

    const listFields = fields || this.getFieldListNames();
    /*if (this.__ENTITY__.name === 'Document' && currentController.document !== "Document") {
       listFields.push('is_single');
    }*/

    listFields.push('is_single');
    const condition = { ...this.buildCondition({ ...(q || {}), ...(this.__DOCUMENT__ || {}) }), ...filters };

    //const condition = { ...this.buildCondition(q), ...filters };

    pagination.totalRecords = await this.records(condition);

    pagination.totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);
    const selfPagination = JSON.parse(JSON.stringify(pagination));
    loopar.db.pagination = pagination;

    const rows = await loopar.db.getList("Entity", listFields, condition);

    if (rows.length === 0 && pagination.page > 1) {
      await loopar.session.set(this.__ENTITY__.name + "_page", 1);
      return await this.getList({ fields, filters, q, rowsOnly });
    }

    return Object.assign((rowsOnly ? {} : await this.__data__()), {
      labels: this.getFieldListLabels(),
      fields: listFields,
      rows: rows,
      pagination: selfPagination,
      q
    });
  }
}