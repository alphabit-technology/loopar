import { BaseDocument, fileManage, loopar } from "loopar-env";
import { Helpers } from "loopar-env";
import decamelize from "decamelize";

export default class Document extends BaseDocument {
   constructor(props) {
      super(props);
   }

   async save() {
      if (['Page', 'Form', 'Report'].includes(this.type)) {
         this.is_single = 1;
      } else {
         ![1, "1"].includes(this.is_single) && (this.is_single = 0);
      }

      this.is_static = 0;

      const args = arguments[0] || {};
      const validate = args.validate !== false;

      this.fixFields();
      
      if(validate){
         this.validateFields();
         this.validateTableName();
         !loopar.installing && await this.validateLinkedDocument(SELECT);
         !loopar.installing && await this.validateLinkedDocument(FORM_TABLE);
      }

      await loopar.db.beginTransaction();
      if (this.type === 'Document' && !this.is_single) {
         await loopar.db.makeTable(this.name, this.doc_structure);
      }
      await super.save(arguments[0] || {});
      await loopar.db.endTransaction();

      if (loopar.installing) return;

      await this.makeDocumentStructure();
      await this.makeFiles();
      await this.makeJSON();

      await loopar.makeConfig();
   }

   clientFieldsList(fields = this.doc_structure) {
      return (fields || []).reduce((acc, field) => {
         return acc.concat(field, this.clientFieldsList(field.elements || []));
      }, []);
   }

   writableFieldsList(){
      return this.clientFieldsList().filter(field => fieldIsWritable(field));
   }

   fixFields() {
      let exist_column = false;

      const fixFields = (fields = this.doc_structure, field_data = {}) => {
         return (fields || []).map(field => {
            field.data = Object.entries(field.data || {}).reduce((obj, [key, value]) => {
               if (value === null || value === undefined || value === "" || value === "null" || value === "undefined" || value === 0 || value === "0") {
                  return obj;
               } else {
                  return { ...obj, [key]: value };
               }
            }, {});

            const field_d = field_data.data || {};

            if (field_d.name === field.data.name) {
               exist_column = true;
               Object.assign(field.data, field_d);
            }

            field.elements = fixFields(field.elements || [], field_data);

            if (this.__IS_NEW__ && field.data.required) {
               field.data.in_list_view = 1;
            }

            return field;
         });
      }

      const name_structure = {
         element: INPUT,
         is_writable: true,
         data: {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: 1,
            in_list_view: 1,
            set_only_time: 1,
            unique: 1,
         }
      };

      /*const is_deleted = {
         element: INPUT,
         is_writable: true,
         data: {
            name: 'is_deleted',
            label: 'Is Deleted',
            type: 'text',
            required: 0,
            in_list_view: 0,
            set_only_time: 0,
            unique: 0,
            hidden: 1
         }
      };*/

      const id_structure = {
         element: ID,
         is_writable: true,
         data: {
            name: 'id',
            label: 'ID',
            type: INTEGER,
            required: 1,
            in_list_view: 0,
            hidden: 1
         }
      };

      const deleted_at = {
         element: DATE_TIME,
         is_writable: true,
         data: {
            name: 'deleted_at',
            label: 'Deleted At',
            hidden: 1
         }
      };

      if (this.type === 'Document') {
         this.doc_structure = fixFields(this.doc_structure, name_structure);
         if (!exist_column) {
            name_structure.data.hidden = 1;
            this.doc_structure = [name_structure, ...this.doc_structure];
         }
         exist_column = false;

         this.doc_structure = fixFields(this.doc_structure, id_structure);
         if (!exist_column) {
            this.doc_structure = [id_structure, ...this.doc_structure];
         }
         exist_column = false;

         this.doc_structure = fixFields(this.doc_structure, deleted_at);
         if (!exist_column) {
            this.doc_structure = [...this.doc_structure, deleted_at];
         }
         exist_column = false;
      } else {
         this.doc_structure = fixFields(this.doc_structure);
      }
   }

   async delete() {
      if (['Document', 'User', 'Module', 'Module Group', 'App'].includes(this.name)) {
         loopar.throw(`You can not delete ${this.name}`);
         return;
      }

      //TODO: Change to soft delete and cascade delete
      await super.delete();

      /*this.is_deleted = 1;
      await this.save();*/
   }

   validateFieldName(name) {
      if (name.length < 3 && name !== 'id') {
         loopar.throw('Field name must be at least 3 characters long.');
      }

      if (name.length > 64) {
         loopar.throw('Field name must be at most 64 characters long.');
      }

      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
         loopar.throw('Field name must contain only letters, numbers and underscores.');
      }

      if (/^[0-9_]+$/.test(name)) {
         loopar.throw('Field name must not start with a number.');
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

      const duplicates = fields.map(field => field.data.name).filter((value, index, self) => self.indexOf(value) !== index);

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
               if (await loopar.db._count("Document", options[0]) === 0) {
                  errors.push(`Document ${options[0]} is not a valid Document for ${field.data.name}, please check the options.`);
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

   toDir(value){
      return decamelize(value, { separator: '-' });
   }

   nameToFile() {
      return this.toDir(this.name);
   }

   moduleToFile() {
      return this.toDir(this.module);
   }

   /*async app_name() {
      this.__app__ = await loopar.db.get_value("Module", "app_name", this.module);
      return this.__app__;
   }*/

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
      return await loopar.db.getValue("App", "type", this.__app__);
   }

   async makeFiles() {
      const documentPath = await this.documentPath();
      const clientPath = await this.clientPath();
      const appType = await this.__appType__();

      /*Document Model*/
      await fileManage.makeClass(documentPath, this.name, {
         IMPORTS: {
            'BaseDocument': 'loopar-env',
         },
         EXTENDS: 'BaseDocument'
      });
      /*Document Model*/

      /*Document Controller*/
      const extendController = this.is_single ? "SingleController" : "BaseController";
      await fileManage.makeClass(documentPath, `${this.name}Controller`, {
         IMPORTS: {
            [extendController]: 'loopar-env',
         },
         EXTENDS: extendController
      });
      /*Document Controller*/

      const makeView = async (view, context = view) => {
         const importContext = `${Helpers.Capitalize(context)}Context`;

         await fileManage.makeClass(clientPath, this.name + Helpers.Capitalize(view), {
            IMPORTS: {
               [importContext]: `/gui/document/${context}-context.js`,
            },
            EXTENDS: importContext
         }, 'default');
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
      await fileManage.setConfigFile(this.nameToFile(), data.__DOCUMENT__, await this.documentPath());
   }
}