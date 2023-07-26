
'use strict';

import { BaseController, loopar } from 'loopar-env';
import fs from "fs";
import path from "path";
import mime from "mime-types";

export default class FileManagerController extends BaseController {
    constructor(props) {
        super(props);
    }

    getFileType(file) {
        const ext = (file.name || file.originalname).split('.').pop().toLowerCase();
        const type = file.type;

        if (type === 'folder') {
            return 'folder';
        } else if (type === 'file') {
            const mimeType = mime.lookup(ext);

            if (mimeType) {
                const parts = mimeType.split('/');
                return parts[0];
            } else {
                return 'file';
            }
        } else {
            return 'file';
        }
    }

    async actionView() {
        const doc = await loopar.getList("File Manager");

        const files = await this.#filesList();

        doc.rows = files;

        return super.render(doc);
    }

    async actionUpload() {
        const files = this.req.files || [];

        for (const file of files) {
            const file_manager = await loopar.new_document("File Manager");
            file_manager.req_upload_file = file;
            await file_manager.save();
        }

        return this.success('ok');
    }

    async actionFiles() {
        const route = (this.data || {}).route;
        const files = await this.#filesList(route);
        return super.render({ files });
    }

    async #filesList(route) {
        const pathBase = loopar.makePath(loopar.pathRoot, 'public', 'uploads', route || '');
        const files = [];
        const dir = await fs.promises.opendir(pathBase);

        for await (const dirent of dir) {
            const filePath = path.join(pathBase, dirent.name);
            const stats = await fs.promises.stat(filePath);

            const file = {
                name: dirent.name,
                type: stats.isDirectory() ? 'folder' : this.getFileType(dirent),
                size: stats.size,
                created_at: stats.birthtimeMs
            };

            files.push(file);
        }

        return files;
    }
}