
'use strict';

import { BaseDocument, loopar, fileManage } from 'loopar';
import mime from "mime-types";
import fs from "fs";
import sharp from "sharp";
import path from 'pathe';

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

        const ext = (file.name || file.originalname).split('.').pop().toLowerCase();
        const mimeType = mime.lookup(ext)?.split('/')?.shift();
        return mimeType ?? 'file';
    }

    get pathBase() {
        if (this.app && this.app.length > 0) {
            return loopar.makePath(loopar.pathRoot, 'apps', this.app, 'public', 'uploads');
        } else {
            return loopar.makePath(loopar.pathRoot, 'public', 'uploads');
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
        /*const mimeType = mime.lookup(this.extention);

        return {
            name: this.name,
            buffer: file,
            mimeType: mimeType,
            size: this.size
        };*/
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

        if (!file || !this.__IS_NEW__) {
            //const lastName = loopar.db.getValue('File Manager', "name", this.name}
            await super.save();
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
            src: `/uploads/${file.originalname}`
        }];
        this.file_ref = JSON.stringify(JSONFIle);


        /**
         * When trying to save a file and a reference already exists in the database with the same name
         */
        if (currentRefSaved) {
            await loopar.db.setValue('File Manager', "__document_status__", currentRefSaved, currentRefSaved);
            const refSaved = await loopar.getDocument('File Manager', currentRefSaved);
            refSaved.__document_status__ = 'active';

            if (refSaved.app !== this.app) {
                /**
                 * If the file is in another application, it is saved with a new name for the current application
                 */
                this.__DOCUMENT_NAME__ = newName;
                this.name = newName;
                this.#reqUploadFile.name = newName;

                //return await this.save();
            }
        }
        /**
         * If the file already exists id disk
         * */
        if (fs.existsSync(filePath)) {
            const savedFile = fs.readFileSync(filePath);

            /**
             * When trying to save a file with the same name but different.
             * The file is saved with a new name
             * */

            if (loopar.utils.hash(savedFile) !== loopar.utils.hash(file.buffer)) {
                this.name = newName;
                this.#reqUploadFile.name = newName;

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

        return new Promise((resolve, reject) => {
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
        await super.delete();
        /*const pathBase = this.pathBase;
        const filePath = path.join(pathBase, this.name);

        if (fs.existsSync(filePath)) {
            if (this.type === 'folder') {
                if (fs.existsSync(filePath)) {
                    fs.rmdirSync(filePath, {recursive: true});
                }
            } else {
                fs.existsSync(filePath) && fs.unlinkSync(filePath);

                const thumbnailPath = this.thumbnailPath;
                const thumbnailFile = path.join(thumbnailPath, this.name);
                fs.existsSync(thumbnailFile) && fs.unlinkSync(thumbnailFile);
            }
        }*/
    }

    loadDiskFiles(rows = []) {
        const apps = fs.readdirSync(loopar.makePath(loopar.pathRoot, 'apps'));

        const loadFiles = (source = "public") => {
            if (fs.existsSync(path.join(loopar.pathRoot, source, 'public', 'uploads'))) {
                const diskFiles = fs.readdirSync(path.join(loopar.pathRoot, source, 'public', 'uploads'));

                diskFiles.forEach(file => {
                    const stat = fs.statSync(path.join(loopar.pathRoot, source, 'public', 'uploads', file));
                    if (!stat.isDirectory()) {
                        rows.push({
                            name: file,
                            created_at: stat.birthtime,
                            extention: file.split('.').pop(),
                            size: stat.size,
                            app: this.app
                        });
                    }
                });
            }
        }

        if (this.app) {
            loadFiles(`apps/${this.app}`)
        } else {
            for (const app of apps) {
                loadFiles(`apps/${app}`);
            }
        }

        return rows;
    }

    paginate(array, pageNumber, pageSize) {
        array = array.filter(row =>
            (row.name || "").toLowerCase().includes((this.name || "").toLowerCase()) &&
            (row.extention || "").toLowerCase().includes((this.extention || "").toLowerCase())
        );
        // Validación de entrada
        if (!Array.isArray(array)) {
            throw new Error("El primer argumento debe ser un array.");
        }
        if (pageNumber < 1 || pageSize < 1) {
            throw new Error("El número de página y el tamaño de página deben ser mayores a 0.");
        }

        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return array.slice(startIndex, endIndex);
    }

    async getList({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
        if (this.__ENTITY__.is_single) {
            return loopar.throw({
                code: 404,
                message: "This document is single, you can't get list"
            });
        }

        const pagination = {
            page: loopar.session.get(this.__ENTITY__.name + "_page") || 1,
            pageSize: 10,
            totalPages: 4,
            totalRecords: 1,
            sortBy: "id",
            sortOrder: "asc",
            __ENTITY__: this.__ENTITY__.name
        };

        const listFields = fields || this.getFieldListNames();
        /*if (this.__ENTITY__.name === 'Document' && currentController.document !== "Document") {
            listFields.push('is_single');
        }*/

        if (this.__ENTITY__.name === 'Entity') {
            listFields.push('is_single');
        }

        const condition = { ...this.buildCondition(q), ...filters };

        const diskFiles = this.loadDiskFiles();

        pagination.totalRecords = await this.records(condition) + diskFiles.length;

        pagination.totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);
        const selfPagination = JSON.parse(JSON.stringify(pagination));
        loopar.db.pagination = pagination;

        const rows = this.paginate(
            this.loadDiskFiles(await loopar.db.getList(this.__ENTITY__.name, [...listFields, "id"], condition)),
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
}