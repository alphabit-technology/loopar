
'use strict';

import {BaseController, loopar} from 'loopar-env';
import fs from "fs";
import path from "path";
import mime from "mime-types";
import multer from "multer";

export default class FileManagerController extends BaseController {
    constructor(props){
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

    async action_view(){
        const doc = await loopar.get_list("File Manager");

        const files = await this.#files_list();

        doc.rows = files;

        return super.render(doc);
    }

    async action_upload() {
        const files = this.req.files || [];

        for (const file of files) {
            const file_manager = await loopar.new_document("File Manager");
            file_manager.req_upload_file = file;
            await file_manager.save();
        }

        return this.success('ok');
    }

    async action_files() {
        const route = (this.data || {}).route;
        const files = await this.#files_list(route);
        return super.render({files});
    }

    async #files_list(route){
        const pathBase = path.join(loopar.path_root, 'public', 'uploads', route || '');
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