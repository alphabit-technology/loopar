import {loopar, CoreInstaller, fileManage } from "loopar-env";
import sha1 from "sha1";

export default class Installer extends CoreInstaller {
  constructor(props) {
    super(props);
  }

  async install() {
    loopar.installing = true;
    await this.setDbConfig();
    await loopar.db.initialize();
    await loopar.db.alterSchema();
    await this.#makeCoreTable();

    await super.install();
  }

  async setDbConfig() {
      const db_config = fileManage.getConfigFile('db.config');

      db_config.database = 'db_' + sha1(this.company);

      env.db_config = db_config;
      return await fileManage.setConfigFile('db.config', db_config);
  }

  async #makeCoreTable() {
        const coreData = await this.getDoctypeData("loopar", "core", "Document");

        await this.insertRecord("Document", coreData, "loopar/modules/core");
    }
}