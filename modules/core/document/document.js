import { BaseDocument, file_manage, loopar } from "loopar-env";
import path from "path";
import { Helpers } from "loopar-env";

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

      this.fix_fields();
      this.validate_fields();
      this.validateTableName();
      !loopar.installing && await this.validate_document_for_select_type();

      await loopar.db.begin_transaction();
      if (this.type === 'Document' && !this.is_single) {
         await loopar.db.make_table(this.name, this.doc_structure);
      }
      await super.save(arguments[0] || {});
      await loopar.db.end_transaction();

      if (loopar.installing) return;

      await this.make_document_structure();
      await this.make_files();
      await this.make_json();
      await this.update_installer();

      await loopar.make_config();
   }

   async update_installer(delete_document = false) {
      const app_name = await this.app_name();
      const values = await this.values();
      await loopar.update_installer('apps/' + app_name, "Document", this.name, values, delete_document);
   }

   client_fields_list(fields = this.doc_structure) {
      return (fields || []).reduce((acc, field) => {
         return acc.concat(field, this.client_fields_list(field.elements || []));
      }, []);
   }

   fix_fields() {
      let exist_column = false;

      const fix_fields = (fields = this.doc_structure, field_data = {}) => {
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

            field.elements = fix_fields(field.elements || [], field_data);

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
         this.doc_structure = fix_fields(this.doc_structure, name_structure);
         if (!exist_column) {
            name_structure.data.hidden = 1;
            this.doc_structure = [name_structure, ...this.doc_structure];
         }
         exist_column = false;

         this.doc_structure = fix_fields(this.doc_structure, id_structure);
         if (!exist_column) {
            this.doc_structure = [id_structure, ...this.doc_structure];
         }
         exist_column = false;

         this.doc_structure = fix_fields(this.doc_structure, deleted_at);
         if (!exist_column) {
            this.doc_structure = [...this.doc_structure, deleted_at];
         }
         exist_column = false;
      } else {
         this.doc_structure = fix_fields(this.doc_structure);
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

   validate_fields() {
      const fields = this.client_fields_list();

      for (const field of fields) {
         this.validateFieldName(field.data.name);
      }

      const duplicates = fields.map(field => field.data.name).filter((value, index, self) => self.indexOf(value) !== index);

      if (duplicates.length) {
         loopar.throw(`Duplicate field names:<br/> ${duplicates.join(', ')}`);
      }
   }

   async validate_document_for_select_type() {
      const errors = [];
      const fields = this.client_fields_list();
      for (const field of fields) {
         if (field.element === SELECT) {
            const options = (field.data.options || "").split("\n");

            if (options.length === 1 && options[0] !== "") {
               if (await loopar.db.count("Document", options[0]) === 0) {
                  errors.push("Document " + options[0] + " is not a valid Document");
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

   name_to_file() {
      return this.name.replaceAll(/\s+/g, '-').toLowerCase();
   }

   module_to_file() {
      return this.module.replaceAll(/\s+/g, '-').toLowerCase();
   }

   async app_name() {
      this.__app__ = await loopar.db.get_value("Module", "app_name", this.module);
      return this.__app__;
   }

   async module_path() {
      return path.join("apps", await this.app_name(), "modules", this.module_to_file());
   }

   async document_path() {
      return path.join(await this.module_path(), this.name_to_file());
   }

   async client_path() {
      return path.join(await this.document_path(), 'client');
   }

   async make_document_structure() {
      await file_manage.make_folder(await this.document_path(), 'client');
   }

   async __app_type__() {
      return await loopar.db.get_value("App", "type", this.__app__);
   }

   async make_files() {
      const document_path = await this.document_path();
      const client_path = await this.client_path();
      const app_type = await this.__app_type__();

      /*Document Model*/
      await file_manage.make_class(document_path, this.name, {
         IMPORTS: {
            'BaseDocument': 'loopar-env',
         },
         EXTENDS: 'BaseDocument'
      });
      /*Document Model*/

      /*Document Controller*/
      const extendController = this.is_single ? "SingleController" : "BaseController";
      await file_manage.make_class(document_path, `${this.name}Controller`, {
         IMPORTS: {
            [extendController]: 'loopar-env',
         },
         EXTENDS: extendController
      });
      /*Document Controller*/

      const make_view = async (view, context = view) => {
         const import_context = `${Helpers.Capitalize(context)}Context`;

         await file_manage.make_class(client_path, this.name + Helpers.Capitalize(view), {
            IMPORTS: {
               [import_context]: `/gui/document/${context}-context.js`,
            },
            EXTENDS: import_context
         }, 'default');
      }

      /*Document Client*/
      if (app_type === "Web App" && this.type === "Page") {
         await make_view("view", "web");
      } else {
         if (this.type === "Page") {
            await make_view("view");
         } else if (this.type === "Form") {
            await make_view("form");
         } else if (this.type === "Report") {
            await make_view("report");
         } else if (this.type === "Document") {
            for (const context of ["list", "form", "view", "report"]) {
               await make_view(context);
            }
         }
      }
      /*Document Client*/
   }

   /**installer**/
   async make_json() {
      const data = await this.__data__();
      await file_manage.set_config_file(this.name_to_file(), data.__DOCUMENT__, await this.document_path());
   }
}