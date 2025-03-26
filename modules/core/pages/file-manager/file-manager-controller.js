
'use strict';

import {BaseController, loopar} from 'loopar';

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

  async actionDelete() {
    const fileManager = await loopar.newDocument("File Manager");

    fileManager.name = this.file_name;
    fileManager.app = this.app;
    await fileManager.delete();

    return this.success('File deleted successfully');
  }
}