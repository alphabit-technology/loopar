
'use strict';

import {BaseDocument, loopar, file_manage} from 'loopar-env';
import mime from "mime-types";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export default class FileManager extends BaseDocument {
    constructor(props){
        super(props);
    }

    getFileType() {
        const file = this.req_upload_file;
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

    async save(){
        const pathBase = path.join(loopar.path_root, 'public', 'uploads');

        if (!fs.existsSync(pathBase)) {
            fs.mkdirSync(pathBase, { recursive: true });
        }

        const file = this.req_upload_file;
        const filePath = path.join(pathBase, file.originalname);

        if (fs.existsSync(filePath)) {
            loopar.throw("File already exists");
        }

        this.name = file.originalname;
        this.size = file.size;
        this.type = this.getFileType();
        this.extention = file.originalname.split('.').pop();
        this.route = file.originalname || '';
        this.created_at = new Date();

        await super.save();

        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, file.buffer, async (err) => {
                if (err) {
                    loopar.throw(err)
                }

                const thumbnail_path = path.join(loopar.path_root, "public", "uploads", "thumbnails", this.name);
                const thumbnail = await file_manage.exist_file(thumbnail_path);

                if (!thumbnail) {
                    await sharp(file.buffer).resize(200, 200).toFile(thumbnail_path);
                }

                resolve(this);
            });
        });
    }

    async delete() {
        await super.delete();
        const pathBase = path.join(loopar.path_root, 'public', 'uploads');
        const filePath = path.join(pathBase, this.name);

        if (fs.existsSync(filePath)) {
            if (this.type === 'folder') {
                if (fs.existsSync(filePath)) {
                    fs.rmdirSync(filePath, {recursive: true});
                }
            } else {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                const thumbnailPath = path.join(pathBase, 'thumbnails', this.name);

                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            }
        }
    }
}