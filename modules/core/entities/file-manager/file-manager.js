
'use strict';

import { BaseDocument, loopar, fileManage } from 'loopar';
import mime from "mime-types";
import fs from "fs";
import sharp from "sharp";
import path from 'pathe';
import _ from "lodash";

export default class FileManager extends BaseDocument {
  #reqUploadFile = null;
  #route = null;
  constructor(props) {
    super(props);
  }

  get reqUploadFile() {
    return this.#reqUploadFile;
  }

  set reqUploadFile(file) {
    this.size = file.size;
    this.type = this.getFileType(file);
    this.extention = file.originalname.split('.').pop();
    this.route = file.originalname || '';

    if (this.__IS_NEW__) {
      this.name = file.originalname;
      this.created_at = new Date();
    }

    this.#reqUploadFile = file;
  }

  getFileType(file) {
    file ??= this.reqUploadFile;
    if(!file) return 'file';

    const ext = (file.originalname || file.name).split('.').pop().toLowerCase();
    const mimeType = mime.lookup(ext)?.split('/')?.shift();
    return mimeType ?? 'file';
  }

  get pathBase() {
    if (this.app && this.app.length > 0) {
      return loopar.makePath(loopar.pathRoot, 'apps', this.app, 'uploads', this.visible || "public");
    } else {
      return loopar.makePath(loopar.pathRoot, 'uploads', this.visible || "public");
    }
  }

  getStatFile() {
    const pathBase = this.pathBase;
    const filePath = path.join(pathBase, this.name);
    try {
      return fs.statSync(filePath);
    } catch (e) {
      return null;
    }
  }

  getFile() {
    const pathBase = this.pathBase;
    const filePath = path.join(pathBase, this.name);
    try {
      return fs.readFileSync(filePath);
    } catch (e) {
      return null;
    }
  }

  metaFile() {
    return loopar.utils.isJSON(this.file_ref) ? JSON.parse(this.file_ref)[0] : {};
  }

  get thumbnailPath() {
    return loopar.makePath(this.pathBase, "thumbnails");
  }

  get filePath() {
    return loopar.makePath(this.pathBase, this.name);
  }

  get route() {
    return this.metaFile().src;
  }

  set route(route) {
    this.#route = route;
  }

  get isLocal() {
    return this.route.startsWith('/');
  }

  get isRemote() {
    return !this.isLocal;
  }

  async save() {
    const file = this.reqUploadFile;

    if (!file) {
      return await super.save();
    }

    const pathBase = this.pathBase;
    const thumbnailPath = this.thumbnailPath;
    fs.mkdirSync(thumbnailPath, { recursive: true });

    const filePath = path.join(loopar.makePath(pathBase), file.originalname);
    const currentRefSaved = await loopar.db.getValue('File Manager', "name", file.originalname, { includeDeleted: true });
    const newName = `${file.originalname.split('.').shift()}_${Date.now()}.${file.originalname.split('.').pop()}`;

    const JSONFIle = [{
      name: file.originalname,
      type: this.getFileType(file),
      size: file.size,
      src: `/uploads/${this.visible || 'public'}${file.originalname}`
    }];

    this.file_ref = JSON.stringify(JSONFIle);

    /**
     * When trying to save a file and a reference already exists in the database with the same name
     */
    if (currentRefSaved) {
      await loopar.db.setValue('File Manager', "__document_status__", currentRefSaved, currentRefSaved);
      const refSaved = await loopar.getDocument('File Manager', currentRefSaved);
      refSaved.__document_status__ = 'Active';

      if (refSaved.app !== this.app) {
        /**
         * If the file is in another application, it is saved with a new name for the current application
         */
        this.__DOCUMENT_NAME__ = newName;
        this.name = newName;
        this.#reqUploadFile.name = newName;
      }
    }
    /**
     * If the file already exists in disk
     * */
    if (fs.existsSync(filePath)) {
      const savedFile = fs.readFileSync(filePath);

      /**
       * When trying to save a file with the same name but different.
       * The file is saved with a new name
       * */

      if (savedFile && !savedFile.equals(file.buffer)) {
        this.name = newName;
        this.#reqUploadFile.name = newName;
        this.#reqUploadFile.originalname = newName;

        return await this.save();
      }

      return;
    }


    /**
     * If the file does not exist in the database, it is saved
     */
    if (!currentRefSaved) {
      await super.save();
    }

    return new Promise((resolve) => {
      fs.writeFile(filePath, file.buffer, async (err) => {
        if (err) {
          loopar.throw(err);
          return;
        }

        if (this.getFileType() === 'image') {
          const thumbnailFile = path.join(thumbnailPath, file.originalname);
          const thumbnail = await fileManage.existFile(thumbnailFile);

          !thumbnail && await sharp(file.buffer).resize(200, 200).toFile(thumbnailFile);
        }

        resolve(this);
      });
    });
  }

  async delete() {
    if(this.__IS_NEW__ && await loopar.db.count("File Manager", this.name)) {
      const file = await loopar.getDocument("File Manager", this.name);
      return await file.delete();
    }
    
    !this.__IS_NEW__ && await super.delete();

    const pathBase = this.pathBase;
    const filePath = path.join(pathBase, this.name);

    if (fs.existsSync(filePath)) {
      if (this.type === 'folder') {
        if (fs.existsSync(filePath)) {
          fs.rmdirSync(filePath, { recursive: true });
        }
      } else {
        fs.existsSync(filePath) && fs.unlinkSync(filePath);

        const thumbnailPath = this.thumbnailPath;
        const thumbnailFile = path.join(thumbnailPath, this.name);
        fs.existsSync(thumbnailFile) && fs.unlinkSync(thumbnailFile);
      }
    }
  }

  loadDiskFiles(rows = []) {
    const apps = fs.readdirSync(loopar.makePath(loopar.pathRoot, 'apps'));

    const loadFiles = (source = "uploads", app) => {
      const sourcePath = path.join(loopar.pathRoot, source);

      if (fs.existsSync(sourcePath)) {
        const filesPath = path.join(sourcePath, this.visible || "public");
        if (fs.existsSync(filesPath)) {
          const diskFiles = fs.readdirSync(filesPath);

          diskFiles.forEach(file => {
            const stat = fs.statSync(path.join(filesPath, file));

            if (!stat.isDirectory()) {
              if(rows.findIndex(r => r.name === file) === -1) {
                rows.push({
                  name: file,
                  created_at: stat.birthtime,
                  extention: file.split('.').pop(),
                  size: stat.size,
                  app: app
                });
              }
            }
          });
        }
      }
    }

    if (this.app) {
      loadFiles(`apps/${this.app}/uploads`, this.app);
    } else {
      for (const app of apps) {
        loadFiles(`apps/${app}/uploads`, app);
      }

      loadFiles("uploads");
    }

    return rows;
  }

  loadFile(file) {
    file ??= this.getStatFile();

    if (file) {
      this.file_ref = JSON.stringify([{
        name: this.name,
        type: this.getFileType({name: this.name, ...file}),
        size: this.size,
        src: `/assets/${this.visible || "public"}/${this.name}`
      }]);

      this.size = file.size;
      this.created_at = file.birthtime;
      this.extention = this.name.split('.').pop();
      this.type = this.getFileType({name: this.name, ...file});
      this.name = this.name;

      return true;
    }

    return false;
  }

  paginate(array, pageNumber, pageSize) {
    array = array.filter(row =>
      (row.name || "").toLowerCase().includes((this.name || "").toLowerCase()) &&
      (row.extention || "").toLowerCase().includes((this.extention || "").toLowerCase())
    );

    if (!Array.isArray(array)) {
      throw new Error("Invalid array.");
    }
    if (pageNumber < 1 || pageSize < 1) {
      throw new Error("Page Numbe and Page Size must be greater than 0.");
    }

    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return array.slice(startIndex, endIndex);
  }

  async getList({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
    q ??= {};
    q.visible = this.visible || "public";
    
    const pagination = {
      page: loopar.session.get(this.__ENTITY__.name + "_page") || 1,
      pageSize: 10,
      totalPages: 4,
      totalRecords: 1,
      sortBy: "id",
      sortOrder: "asc",
      __ENTITY__: this.__ENTITY__.name
    };

    const listFields = this.getFieldListNames();
    /*if (this.__ENTITY__.name === 'Document' && currentController.document !== "Document") {
        listFields.push('is_single');
    }*/

    const condition = { ...this.buildCondition(q), ...filters };

    const diskFiles = this.loadDiskFiles();

    pagination.totalRecords = await this.records(condition) + diskFiles.length;

    pagination.totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);
    const selfPagination = JSON.parse(JSON.stringify(pagination));
    loopar.db.pagination = pagination;

    const rows = this.paginate(
      this.loadDiskFiles(await loopar.db.getList("File Manager", [...listFields, "id"], condition)),
      pagination.page,
      pagination.pageSize
    )

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

  async getPrivateFile() {
    const file = await loopar.db.getDoc("File Manager", this.name);
  }
}