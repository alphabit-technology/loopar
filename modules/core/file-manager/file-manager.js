
'use strict';

import {BaseDocument, loopar, fileManage} from 'loopar-env';
import mime from "mime-types";
import fs from "fs";
import sharp from "sharp";
import path from 'path';

export default class FileManager extends BaseDocument {
    #reqUploadFile = null;
    #route = null;
    constructor(props){
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

        if(this.__IS_NEW__){
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
        if(this.app && this.app.length > 0){
            return loopar.makePath(loopar.pathRoot, 'apps', this.app, 'public', 'uploads');
        }else{
            return loopar.makePath(loopar.pathRoot, 'public', 'uploads');
        }
    }

    getFile(){
        const pathBase = this.pathBase;
        const filePath = path.join(pathBase, this.name);
        try{
            return fs.readFileSync(filePath);
        }catch(e){
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

    metaFile(){
        return loopar.utils.isJSON(this.file_ref) ? JSON.parse(this.file_ref)[0] : {};
    }

    get thumbnailPath() {
        return loopar.makePath(this.pathBase, "thumbnails");
    }

    get filePath() {
        return loopar.makePath(this.pathBase, this.name);
    }

    get route(){
        return this.metaFile().src;
    }

    set route(route){
        this.#route = route;
    }

    get isLocal() {
        return this.route.startsWith('/');
    }

    get isRemote() {
        return !this.isLocal;
    }

    async save(){
        const file = this.reqUploadFile;

        if (!file || !this.__IS_NEW__) {
            //const lastName = loopar.db.getValue('File Manager', "name", this.name}
            await super.save();
        }

        const pathBase = this.pathBase;
        const thumbnailPath = this.thumbnailPath;
        fs.mkdirSync(thumbnailPath, { recursive: true });

        const filePath = path.join(loopar.makePath(pathBase), file.originalname);
        const currentRefSaved = await loopar.db.getValue('File Manager', "name", file.originalname, {includeDeleted: true});
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
        if(currentRefSaved){
            await loopar.db.setValue('File Manager', "__document_status__",  currentRefSaved, currentRefSaved);
            const refSaved = await loopar.getDocument('File Manager', currentRefSaved);
            refSaved.__document_status__ = 'active';

            if(refSaved.app !== this.app){
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

            if(loopar.utils.hash(savedFile) !== loopar.utils.hash(file.buffer)){
                this.name = newName;
                this.#reqUploadFile.name = newName;

                return await this.save();
            }

            return;
        }


        /**
         * If the file does not exist in the database, it is saved
         */
        if(!currentRefSaved){
            await super.save();
        }

        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, file.buffer, async (err) => {
                if (err) {
                    loopar.throw(err);
                    return;
                }

                if(this.getFileType() === 'image'){
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
}