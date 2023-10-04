import {loopar, CoreInstaller, fileManage } from "loopar-env";
import sha1 from "sha1";

export default class Installer extends CoreInstaller {
  module = "core";
  constructor(props) {
    super(props);
  }

  async install() {
    loopar.installingApp = "loopar";
    await this.setDbConfig();
    await loopar.db.initialize();
    await loopar.db.alterSchema();
    await this.#makeCoreTable();

    return await super.install();
  }

  async setDbConfig() {
      const db_config = fileManage.getConfigFile('db.config');
      db_config.database = 'db_' + sha1(this.company);

      env.dbConfig = db_config;
      return await fileManage.setConfigFile('db.config', db_config);
  }

  async #makeCoreTable() {
    const coreData = await this.getDocumentData("loopar", "core", "Document");
      await this.insertRecord("Document", coreData, "loopar", "core");
  }
}