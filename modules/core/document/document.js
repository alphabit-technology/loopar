import { BaseDocument, documentManage, fileManage, loopar, MetaComponents } from "loopar";
import { Helpers } from "loopar";
import decamelize from "decamelize";
import { fileTypeFromBuffer } from 'file-type';


export default class Document extends BaseDocument {
  __CORE_FILES__ = [];
  constructor(props) {
    super(props);
  }

  async save() {
    //console.log("On save Document APP", this.__APP__);
    if (['Page', 'Form', 'Report'].includes(this.type)) {
      this.is_single = 1;
    } else {
      ![1, "1"].includes(this.is_single) && (this.is_single = 0);
    }

    this.is_static = 0;

    const args = arguments[0] || {};
    const validate = args.validate !== false;
    await this.fixFields(this.doc_structure);

    if (validate) {
      this.validateFields();
      this.validateTableName();
      !loopar.installing && await this.validateLinkedDocument(SELECT);
      !loopar.installing && await this.validateLinkedDocument(FORM_TABLE);
    }

    if (!loopar.installing) await loopar.db.beginTransaction();
    if (this.type === 'Document' && !this.is_single) {
      await loopar.db.makeTable(this.name, this.doc_structure);
    }
    await super.save(arguments[0] || {});
    await this.save__CORE_FILES__();
    if (!loopar.installing) await loopar.db.endTransaction();

    if (loopar.installing) return;

    await this.makeDocumentStructure();
    await this.makeFiles();
    await this.makeJSON();

    await loopar.makeConfig();
  }

  async save__CORE_FILES__() {
    for (const file of this.__CORE_FILES__ || []) {
      const fileManager = await loopar.newDocument("File Manager");

      fileManager.reqUploadFile = file;
      fileManager.app = this.__APP__;
      await fileManager.save();
    }

    this.__CORE_FILES__ = [];
  }

  clientFieldsList(fields = this.doc_structure) {
    return loopar.utils.fieldList(fields);
    /*return (fields || []).reduce((acc, field) => {
       return acc.concat(field, this.clientFieldsList(field.elements || []));
    }, []);*/
  }

  writableFieldsList() {
    return this.clientFieldsList().filter(field => fieldIsWritable(field));
  }

  getSpecialFieldsMeta() {
    return {
      namedContainer: {
        element: ROW,
        data: {
          name: 'name_and_status_container',
        },
        elements: []
      },
      elementsNamed: [
        {
          element: INPUT,
          data: {
            name: 'name',
            label: 'Name',
            required: 1,
            type: 'text',
            in_list_view: 1,
            set_only_time: 1,
            unique: 1,
            searchable: 1
          }
        },
        {
          element: SELECT,
          data: {
            name: '__document_status__',
            label: 'Status',
            options: 'Active\nInactive\nDraft\nPending\nApproved\nRejected\nArchived\nDeleted',
            default_value: 'Active',
            hidden: 1,
          }
        },
        {
          element: ID,
          data: {
            name: 'id',
            label: 'ID',
            type: INTEGER,
            required: 1,
            in_list_view: 0,
            hidden: 1
          }
        }
      ]
    };
  }

  insertField(field, targetField, position = 'after') {
    const fields = this.doc_structure;

    const insertField = (fields, field, targetField, position = 'after') => {
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].data.name === targetField) {
          if (position === 'after') {
            fields.splice(i + 1, 0, field);
          } else if (position === 'before') {
            fields.splice(i, 0, field);
          }
          return;
        } else if (fields[i].elements && fields[i].elements.length > 0) {
          insertField(fields[i].elements, field, targetField, position);
        }
      }
    }

    insertField(fields, field, targetField, position);
  }

  async fixFields() {
    const __IS_NEW__ = this.__IS_NEW__;

    const updateOrInsertField = ({ fields = this.doc_structure, field, position = null, target = null }) => {
      let foundField = false;
      let targetFound = fields;

      const searchAndInsert = (items) => {
        items.forEach(f => {
          if (target && f.data.name === target) {
            targetFound = f.elements || null;
          }

          if (field.data.name === f.data.name) {
            foundField = true;
            Object.assign(f.data, field.data);
          } else if (f.elements && f.elements.length > 0) {
            searchAndInsert(f.elements);
          }
        });
      };

      searchAndInsert(fields);

      if (!foundField && (position === 'after' || position === null)) {
        targetFound.push(field);
      } else if (!foundField && position === 'before') {
        targetFound.unshift(field);
      }

      foundField = false;
      this.doc_structure = fields;
    };

    const removeField = ({ fields = this.doc_structure, fieldName }) => {
      const removeField = (fields) => {
        fields.forEach((field, index) => {
          if (field.data.name === fieldName) {
            fields.splice(index, 1);
          } else if (field.elements && field.elements.length > 0) {
            removeField(field.elements);
          }
        });
      };

      removeField(fields);

      this.doc_structure = fields;
    };

    const getField = (fieldName) => {
      const getField = (fields) => {
        for (const field of fields) {
          if (field.data.name === fieldName) {
            return field;
          } else if (field.elements && field.elements.length > 0) {
            const result = getField(field.elements);
            if (result) {
              return result;
            }
          }
        }
      };

      return getField(this.doc_structure);
    };

    const fixFieldData = async (field) => {
      const updatedData = {};
      const nullValues = [null, undefined, "", "null", "undefined", 0, "0"];

      for (const [key, value] of Object.entries(field.data || {})) {
        //field.id ??= loopar.Helpers.randomString(12);
        if (key === "name" && nullValues.includes(value)) {
          updatedData[key] = Helpers.randomString(12);
        } else {
          updatedData[key] = value;
        }

        if (__IS_NEW__ && key === "required" && field.data.required) {
          updatedData[key] = 1;
        }

        if (key === "background_image" && value) {
          const files = value;

          for (const file of files || []) {
            if (typeof file === "string") continue;

            const typeMatches = file.src.match(/^data:(.*);base64,/);
            const isFile = typeMatches ? typeMatches[1] : null;

            if (!isFile) continue;
            const binaryData = Buffer.from(file.src.split(';base64,')[1], 'base64');
            const fileType = await fileTypeFromBuffer(binaryData);

            file.src = "uploads/" + file.name
            //this.__CORE_FILES__ ??= [];

            this.__CORE_FILES__.push({
              buffer: binaryData,
              originalname: file.name,
              size: binaryData.length,
            });
          }
        }

        if ((key === "background_color" || key === "color_overlay") && JSON.stringify(value) === '{"color":"#000000","alpha":0.5}') {
          updatedData[key] = "";
        }
      }

      return updatedData;
    };

    const fixElements = async (elements) => {
      for (const field of elements) {
        field.data = await fixFieldData(field);

        if (field.elements && field.elements.length > 0) {
          await fixElements(field.elements);
        }
      }

      /*elements.forEach(async field => {
         await fixFieldData(field);
         if (field.elements && field.elements.length > 0) {
            await fixElements(field.elements);
         }
      });*/

      this.doc_structure = elements;
    };

    if (this.type === 'Document') {
      const specialFields = this.getSpecialFieldsMeta();

      updateOrInsertField({ field: specialFields.namedContainer, position: 'before' });
      specialFields.elementsNamed.map(field => {
        updateOrInsertField({ field, position: 'after', target: specialFields.namedContainer.data.name });
      });

      if (getField(specialFields.namedContainer.data.name).elements.length === 0) {
        removeField({ fieldName: specialFields.namedContainer.data.name });
      }

      if (this.is_child) {
        updateOrInsertField({
          field: {
            element: INPUT,
            data: { name: "parent_document", label: "Parent Document", type: INTEGER, hidden: 1 }
          }, position: 'before'
        });

        updateOrInsertField({
          field: {
            element: INPUT,
            data: { name: "parent_id", label: "Parent ID", type: INTEGER, hidden: 1 }
          }, position: 'before'
        });
      }
    }

    await fixElements(this.doc_structure);
  }

  async delete() {
    const { updateInstaller = true, sofDeletetrue } = arguments[0] || {};
    if (['Document', 'User', 'Module', 'Module Group', 'App', 'Connected Element', 'Document History'].includes(this.name)) {
      loopar.throw(`You can not delete ${this.name}`);
      return;
    }

    await super.delete(...arguments);

    /**Is posible that elimate action is calle from uninstall */
    if (updateInstaller) {
      const documentPath = await this.documentPath();
      const meta = await fileManage.getConfigFile(this.name, documentPath);
      meta.__document_status__ = "Deleted";
      await fileManage.setConfigFile(this.name, meta, documentPath);
    }
  }

  validateFieldName(name) {
    if (!name) return;
    const errMessage = `Field name <strong>"${name}"</strong> is not valid. <br/>`;
    if (name.length < 3 && name !== 'id') {
      loopar.throw(`${errMessage}Field name must be at least 3 characters long.`);
    }

    if (name.length > 64) {
      loopar.throw(`${errMessage}Field name must be at most 64 characters long.`);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      loopar.throw(`${errMessage}Field name must contain only letters, numbers and underscores.`);
    }

    if (/^[0-9_]+$/.test(name)) {
      loopar.throw(`${errMessage}Field name must not start with a number.`);
    }

    const reservedKeywords = [
      // Reserved keywords for PostgreSQL
      'DEFAULT', 'UNIQUE', 'PRIMARY', 'FOREIGN', 'INDEX', 'CHECK', 'KEY', 'WHERE',
      'ORDER', 'GROUP', 'LIMIT', 'JOIN', 'AS', 'ON', 'BETWEEN', 'LIKE', 'IN', 'AND',
      'OR', 'NOT', 'NULL', 'TRUE', 'FALSE', 'DATABASE', 'TABLE', 'COLUMN', 'VIEW',
      'TRIGGER', 'PROCEDURE', 'FUNCTION', 'INDEX', 'CONSTRAINT', 'MODE',

      // Reserved keywords for MySQL
      'COLLECTION', 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'FIND',
      'DISTINCT', 'AGGREGATE', 'SORT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'JOIN',
      'UNWIND', 'GROUP', 'MATCH', 'PIPELINE',

      // Reserved keywords for MongoDB
      // ... (Add MongoDB specific reserved keywords here if known)
    ];

    if (reservedKeywords.includes(name.toUpperCase())) {
      loopar.throw(`FieldName <strong>"${name}"</strong> is a reserved keyword.`);
    }
  }

  validateFields() {
    const fields = this.clientFieldsList();

    for (const field of fields) {
      this.validateFieldName(field.data.name);
    }

    const duplicates = fields.map(field => field.data.name).filter((value, index, self) => value && self.indexOf(value) !== index);

    if (duplicates.length) {
      loopar.throw(`Duplicate field names:<br/> ${duplicates.join(', ')}`);
    }
  }

  async validateLinkedDocument(type) {
    const errors = [];
    const fields = this.clientFieldsList();
    for (const field of fields) {
      if (field.element === type && field.data.options && typeof field.data.options === "string") {
        const options = (field.data.options || "").split("\n");

        if (options.length === 1 && options[0] !== "") {
          const DocumentName = options[0].split(":")[0];

          if (await loopar.db._count("Document", DocumentName) === 0) {
            errors.push(`Document ${DocumentName} is not a valid Document for ${field.data.name}, please check the options.`);
          }else if(type === FORM_TABLE){
            const isSingle = await loopar.db.getValue("Document", "is_single", DocumentName);
            if (isSingle) {
              errors.push(`Document ${DocumentName} is a single Document, please use a Document with multiple records.`);
            }

            const isChild = await loopar.db.getValue("Document", "is_child", DocumentName);

            if (isChild !== 1) {
              errors.push(`Document ${DocumentName} is not a child Document, please use a child Document.`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      loopar.throw(errors.join("<br/>"));
    }
  }

  validateTableName() {
    const table_name = this.name;

    if (table_name.length < 3) {
      loopar.throw('Document name must be at least 3 characters long.');
    }

    if (table_name.length > 64) {
      loopar.throw('Document name must be at most 64 characters long.');
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(table_name)) {
      loopar.throw('Document name must contain only letters, numbers and spaces.');
    }

    if (/^[0-9_]+$/.test(table_name)) {
      loopar.throw('Document name must not start with a number.');
    }
  }

  /*async setApp(app) {
     if (this.__DOCUMENT__.name === "Document") {
        this.__APP__ === "loopar";
     } else {
        this.__APP__ = this.__APP__ || await loopar.db.getValue("Module", "app_name", this.module);
     }
  }*/

  toDir(value) {
    return decamelize(value, { separator: '-' });
  }

  nameToFile() {
    return this.toDir(this.name);
  }

  moduleToFile() {
    return this.toDir(this.module);
  }

  get destinityApp() {
    return
  }

  async appNameToDir() {
    return this.toDir(this.__APP__);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module);
  }

  async documentPath() {
    return loopar.makePath(await this.modulePath(), this.name);
  }

  async clientPath() {
    return loopar.makePath(await this.documentPath(), 'client');
  }

  async makeDocumentStructure() {
    await fileManage.makeFolder(await this.documentPath(), 'client');
  }

  async __appType__() {
    return await loopar.db.getValue("App", "type", this.__APP__);
  }

  async makeFiles() {
    const documentPath = await this.documentPath();
    const clientPath = await this.clientPath();
    const appType = await this.__appType__();

    /*Document Model*/
    await fileManage.makeClass(documentPath, this.name, {
      IMPORTS: {
        'BaseDocument': 'loopar',
      },
      EXTENDS: 'BaseDocument'
    });
    /*Document Model*/

    /*Document Controller*/
    const extendController = this.is_single ? "SingleController" : "BaseController";
    await fileManage.makeClass(documentPath, `${this.name}Controller`, {
      IMPORTS: {
        [extendController]: 'loopar',
      },
      EXTENDS: extendController
    });
    /*Document Controller*/

    const makeView = async (view, context = view) => {
      const importContext = `${Helpers.Capitalize(context)}Context`;
      const viewName = this.name + Helpers.Capitalize(view);
      /*const rc = MetaComponents({
        meta: {
          __DOCTYPE__: {
            doc_structure: JSON.stringify(this.doc_structure)
          }
        },
        action: view,
        context: context,
      });
      
      console.log([view, rc])

      const importerComponents = `
import { Components } from "$components-loader";
${rc.map((element) => {
  return `import ${loopar.utils.Capitalize(element.replaceAll("-", ""))} from "@${element.replaceAll("_", "-")}";`;
}).join("\n")}

${rc.map((element) => {
  return `Components["${element}"] = {default: ${loopar.utils.Capitalize(element.replaceAll("-", "")) }}`;
}).join("\n")}

export default Components;
`

      await fileManage.makeFile(clientPath, viewName + "Importer", importerComponents, 'jsx', true);*/
      await fileManage.makeClass(clientPath, viewName, {
        IMPORTS: {
          [importContext]: `@context/${context}-context`,
          [`${viewName}Importer`]: `./${viewName}Importer.jsx`,
        },
        EXTENDS: importContext
      }, 'default', "jsx");
    }

    /*Document Client*/
    if (appType === "Web App" && this.type === "Page") {
      await makeView("view", "web");
    } else {
      if (this.type === "Page") {
        await makeView("view");
      } else if (this.type === "Form") {
        await makeView("form");
      } else if (this.type === "Report") {
        await makeView("report");
      } else if (this.type === "Document") {
        for (const context of ["list", "form", "view", "report"]) {
          await makeView(context);
        }
      }
    }
    /*Document Client*/
  }

  /**installer**/
  async makeJSON() {
    const data = await this.__data__();
    await fileManage.setConfigFile(this.name, data.__DOCUMENT__, await this.documentPath());
  }
}