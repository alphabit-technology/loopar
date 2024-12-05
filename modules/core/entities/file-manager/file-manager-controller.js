'use strict';

import { BaseController, loopar } from 'loopar';
import fs from 'fs';
import { type } from 'os';

export default class FileManagerController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionUpload() {
    const files = this.req.files || [];
    const filesNames = [];

    if (!files.length) {
      return loopar.throw('No files uploaded');
    }

    for (const file of files) {
      const fileManager = await loopar.newDocument("File Manager");
      fileManager.reqUploadFile = file;
      await fileManager.save();
      filesNames.push(fileManager.name);
    }

    return this.success(filesNames.join(', ') + ' uploaded successfully');
  }

  async actionList() {
    const fileManagers = await loopar.getList("File Manager");

    const diskFiles = fs.readdirSync(loopar.makePath(loopar.pathRoot, 'public', 'uploads'));

    diskFiles.forEach(file => {
      if (!fileManagers.rows.some(row => row.name == file)) {
        fileManagers.rows.push({
          name: file,
          created_at: fs.statSync(loopar.makePath(loopar.pathRoot, 'public', 'uploads', file)).birthtime,
          extention: file.split('.').pop(),
          size: fs.statSync(loopar.makePath(loopar.pathRoot, 'public', 'uploads', file)).size,
          app: null
        });
      }
    });

    console.log(['fileManagers', diskFiles, fileManagers.rows]);

    return this.render(fileManagers);
  }
}