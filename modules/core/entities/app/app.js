'use strict';

import { BaseDocument, fileManage, loopar } from 'loopar';

export default class App extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    const args = arguments[0] || {};
    if (this.__IS_NEW__ && this.git_repo && !["null", "undefined"].includes(this.git_repo)) {
      loopar.validateGitRepository(this.git_repo);

      const app_name = this.git_repo.split('/').pop().replace('.git', '');
      const appStatus = await loopar.appStatus(app_name);

      if (fileManage.existFileSync(loopar.makePath('apps', app_name))) {
        if (appStatus === 'installer')
          loopar.throw('App already exists, update or install it in <a href="/developer/App%20Manager/view">App Manage</a>');
        else
          await super.save(args);
      } else {
        await loopar.git(app_name).clone(this.git_repo).then(async () => {
          const appData = fileManage.getAppData(app_name);

          if (!appData || !appData.DeskWorkspace || !appData.DeskWorkspace[app_name]) {
            loopar.throw('Invalid App Structure');
            return;
          }

          const data_info = appData.DeskWorkspace[app_name];

          this.name = app_name;
          this.autor = data_info.autor;
          this.version = data_info.version;
          this.description = data_info.description;
          this.git_repo = data_info.git_repo;
          this.app_info = data_info.app_info;

          await super.save(args);
        });
      }
    } else {
      this.autor = !this.autor || this.autor === '' ? loopar.currentUser.email : this.autor;
      this.version = !this.version || this.version === '' ? '0.0.1' : this.version;
      await super.save(args);
      await this.makeAppStructure();
    }

    await loopar.build();

    return true;
  }

  async makeAppStructure() {
    if (loopar.installing) return;

    await fileManage.makeFolder(loopar.makePath('apps', this.name), 'modules');

    if (!fileManage.existFileSync(loopar.makePath('apps', this.name, 'installer.json'))) {
      await fileManage.setConfigFile('installer', {}, loopar.makePath('apps', this.name));
    }

    await fileManage.makeClass(loopar.makePath('apps', this.name), 'installer', {
      IMPORTS: {
        CoreInstaller: 'loopar'
      },
      EXTENDS: 'CoreInstaller',
    });

  }

  async updateEntities() {
  }

  async buildRequires(Entity, doc) {
    
    const requires = [];

    const fieldIsModel = (field) => {
      if ([SELECT, FORM_TABLE].includes(field.element) && field.data.options && typeof field.data.options === 'string') {
        const options = (field.data.options || "").split("\n");

        return !(options.length > 1 || options[0] === "");
      }
    }

    if(Entity.name === "Entity"){
      //console.log(["Entity", Object.values(Entity.writableFieldsList({ includeFormTable: true }))]);
    }

    for (const field of Object.values(Entity.writableFieldsList({ includeFormTable: true}))) {
      if (fieldIsModel(field)) {
        const [type, name] = field.data.options.split(":");

        if (field.element == SELECT && doc && !(Entity.is_builder || Entity.name === "Entity")) {
          const relatedParentEntity = await loopar.getDocument(name ? type: "Entity", name || field.data.options);
          const relatedEntity = await loopar.getDocument(field.data.options, doc[field.data.name]);
          
          if (relatedEntity) {
            requires.push({
              entity: relatedParentEntity.name,
              name: relatedEntity.name,
              documents: [
                await relatedEntity.rawValues()
              ]
            });
          }
        }else if(field.element == FORM_TABLE){
          const ref = loopar.getRef(field.data.options);
          const entity = await loopar.getDocument(ref.__ENTITY__, field.data.options);

          requires.push({
            entity: ref.__ENTITY__,
            name: ref.name,
            documents: [
              await entity.rawValues()
            ]
          });
        }
      }
    }

    return requires;
  }

  async syncFilesInstaller(){
    const allEntities = loopar.getEntities().map(entity => {
      console.log(["Entity." + entity.name, parseInt(entity.id)])
      return {
        ...entity,
        id: parseInt(entity.id)
      }
    }).sort((a, b) => a.id - b.id);

    const entities = allEntities.filter(entity => {
      return (
        (loopar.utils.compare(entity.__APP__, this.name) || entity.name === "App") || (entity.doc_structure || "").includes("app_name")
      );
    });

    const entitiesStructure = {
      App: {
        name: this.name,
        version: this.version,
      },
      documents: []
    };

    const documents = {}

    for (const entity of entities) {
      if(entity.__APP__ == "Core") continue;

      const entityName = entity.__ENTITY__ || "Entity";

      if (!documents[entityName]){
        const relatedEntity = allEntities.find(ent => ent.name === entityName);

        documents[entityName] = {
          id: relatedEntity.id,
          entity: entityName,
          path: relatedEntity.entityRoot,
          name: entityName,
          documents: []
        }
      }

      for (const e of entities) {
        if (e.__document_status__ !== "Deleted" && loopar.utils.compare(e.__ENTITY__ || "Entity", entityName)) {
          if(documents[entityName].documents.find(doc => doc.id === e.id) || e.__APP__ == "Core") continue;

          //console.log(["Entity.app", entity.__APP__, e])
          documents[entityName].documents.push({
            id: e.id,
            name: e.name, 
            path: e.entityRoot,
            requires: await this.buildRequires(await loopar.getDocument(entityName, e.name))
          });
        }
      }
      
      const ent = {
        id: entity.id,
        name: entity.name,
        path: entity.entityRoot,
        documents: []
      }

      if (await loopar.db.count(entityName, entity.name) === 0) continue;

      const Entity = await loopar.getDocument(entityName, entity.name);

      documents[entityName].requires = await this.buildRequires(Entity);
      //ent.requires = await this.buildRequires(Entity);
     
      if (Entity.include_in_installer && !Entity.is_single && !Entity.is_child && !documents[Entity.name]) {
        const fields = Entity.writableFieldsList().map(field => field.data.name);

        const filters = {
          "!=": { name: "Entity" },
          ...(fields.includes("app_name") ? {"and": { "=": { app_name: this.name } }} : {}),
          ...(Entity.name === "App" ? {"and": { "=": { name: this.name } }} : {})
        };

        const documents = await loopar.db.getAll(
          Entity.name,
          fields,
          filters,
          [true, "true", 1, "1"].includes(Entity.is_single)
        );

        for (const doc of documents.sort((a, b) => a.id - b.id)) {
          if (!loopar.getRef(doc.name)) {
            if(ent.documents.find(d => d.id === doc.id)) continue;

            const Doc = await loopar.getDocument(Entity.name, doc.name);
            
            ent.documents.push({
              id: doc.id,
              name: doc.name,
              data: await Doc.rawValues(),
              requires: await this.buildRequires(Entity, doc)
            });
          }
        }
      }

      ent.documents = ent.documents.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      ent.requires = await this.buildRequires(Entity);
      documents[entityName].documents.push(ent);
    }


    /*** */
    for (const entity of entities) {
      const entityName = entity.__ENTITY__ || "Entity";

      for (const e of entities) {
        if (e.__document_status__ !== "Deleted" && loopar.utils.compare(e.__ENTITY__ || "Entity", entityName)) {
          if (documents[entityName].documents.find(doc => doc.id === e.id)) continue;

          documents[entityName].documents.push({
            id: e.id,
            name: e.name,
            path: e.entityRoot
          });
        }
      }
    }
    /*** */

    entitiesStructure.documents = Object.values(documents).sort((a, b) => a.id - b.id);

    await fileManage.setConfigFile('installer', 
      entitiesStructure,
      loopar.makePath('apps', this.name)
    );
  }

  async unInstall() {
    await loopar.unInstallApp(this.name);
    const installedApps = fileManage.getConfigFile('installed-apps');
    delete installedApps[this.name];
    fileManage.setConfigFile('installed-apps', installedApps);
    return await loopar.build();
  }
}