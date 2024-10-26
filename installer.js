import { loopar, CoreInstaller, fileManage } from "loopar";
import sha1 from "sha1";

export default class Installer extends CoreInstaller {
  module = "core";
  constructor(props) {
    super(props);
  }

  async install() {
    console.log("Installing Loopar");
    loopar.installingApp = "loopar";
    await this.setDbConfig();
    console.log("DB Config set");
    await loopar.db.initialize(true);
    console.log("DB Initialized");
    await loopar.db.alterSchema();
    console.log("Schema Altered");
    await this.#makeCoreTable();
    console.log("Core Table Created");
    return await super.install();
  }

  async setDbConfig() {
    const db_config = fileManage.getConfigFile('db.config');
    db_config.database = 'db_' + sha1(this.company);

    try {
      //await loopar.db.dropSchema(db_config.database);

    } catch (e) {}
   
    env.dbConfig = db_config;
    return await fileManage.setConfigFile('db.config', db_config);
  }

  async #makeCoreTable() {
    const coreData = await this.getDocumentData("Entity");
    //await this.insertRecord("Entity", coreData, "loopar", "core");

    const Entity = await loopar.newDocument("Entity", coreData);
    await Entity.save({save:false, validate:false});
  }
}