'use strict';

import { BaseDocument, fileManage, loopar } from 'loopar';

export default class App extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save(makeStructure = true) {
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

          const dataInfo = appData.DeskWorkspace[app_name];

          this.name = app_name;
          this.autor = dataInfo.autor;
          this.version = dataInfo.version;
          this.description = dataInfo.description;
          this.git_repo = dataInfo.git_repo;
          this.app_info = dataInfo.app_info;

          await super.save(args);
        });
      }
    } else {
      this.autor = !this.autor || this.autor === '' ? loopar.currentUser.email : this.autor;
      this.version = !this.version || this.version === '' ? '0.0.1' : this.version;
      await super.save(args);
      makeStructure && await this.makeAppStructure();
    }

    await loopar.build();

    return true;
  }

  async makeAppStructure() {
    if (loopar.installing) return;

    await fileManage.makeFolder(loopar.makePath('apps', this.name), 'modules');
    await fileManage.makeFolder(loopar.makePath('apps', this.name), 'public', 'uploads', 'thumbnails');

    if (!await loopar.db.count('Module', this.name)) {
      const newModule = await loopar.newDocument('Module', {
        name: this.name,
        description: this.name,
        module_group: 'modules',
        app_name: this.name,
        icon: this.icon,
        in_sidebar: 1
      });

      await newModule.save();
    }

    await fileManage.makeClass(loopar.makePath('apps', this.name), 'installer', {
      IMPORTS: {
        CoreInstaller: 'loopar'
      },
      EXTENDS: 'CoreInstaller',
    });

    this.__IS_NEW__ = false;
    await this.incrementPatch();
  }

  async updateEntities() {
  }

  async buildRequires(Entity, doc) {
    if(!Entity) return [];
    const requires = [];

    const fieldIsModel = (field) => {
      if ([SELECT, FORM_TABLE].includes(field.element) && field.data.options && typeof field.data.options === 'string') {
        const options = (field.data.options || "").split("\n");

        return !(options.length > 1 || options[0] === "");
      }
    }

    for (const field of Object.values(Entity.writableFieldsList({ includeFormTable: true}))) {
      if (fieldIsModel(field)) {
        const [type, name] = field.data.options.split(":");

        if (field.element == SELECT && doc && !(Entity.isBuilder)) {
          const relatedParentEntity = await loopar.getDocument(name ? type : "Entity", name || field.data.options);
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
        }
        
        if(field.element == FORM_TABLE){
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

  async incrementPatch() {
    const version = this.version.split('.');
    version[2] = parseInt(version[2]) + 1;
    this.version = version.join('.');
    await this.save(false);

    await this.syncFilesInstaller();
  }

  async incrementMinor() {
    const version = this.version.split('.');
    version[1] = parseInt(version[1]) + 1;
    version[2] = 0;
    this.version = version.join('.');
    await this.save(false);

    await this.syncFilesInstaller();
  }

  async incrementMajor() {
    const version = this.version.split('.');
    version[0] = parseInt(version[0]) + 1;
    version[1] = 0;
    version[2] = 0;

    this.version = version.join('.');
    await this.save(false);

    await this.syncFilesInstaller();
  }

  async syncFilesInstaller() {
    console.log('syncFilesInstaller');
    /**
     * List of all entities
     */

    const allEntities = loopar.getEntities().map(entity => ({
      ...entity,
      id: parseInt(entity.id)
    })).sort((a, b) => a.id - b.id);

    /**
     * Filter entities when the entity is related to an app
     */
    const entities = allEntities.filter(entity => (
      (loopar.utils.compare(entity.__APP__, this.name) || entity.name === "App") || 
      (entity.doc_structure || "").includes("app_name")
    ));

    const entitiesStructure = {
      App: {
        name: this.name,
        version: this.version,
      },
      documents: []
    };

    const entitiesApp = {}

    for (const entity of entities.filter(e => e.__APP__ != "Core")) {
      const baseEntity = entity.__ENTITY__ || "Entity";

      if (!entitiesApp[baseEntity]){
        const relatedEntity = allEntities.find(ent => ent.name === baseEntity);

        entitiesApp[baseEntity] = {
          id: relatedEntity.id,
          entity: baseEntity,
          path: relatedEntity.entityRoot,
          name: baseEntity,
          documents: []
        }
      }
      
      const ent = {
        id: entity.id,
        name: entity.name,
        path: entity.entityRoot,
        documents: []
      }

      if (await loopar.db.count(baseEntity, entity.name)){
        const Entity = await loopar.getDocument(baseEntity, entity.name);
        entitiesApp[baseEntity].requires = await this.buildRequires(Entity);
      
        if (Entity.include_in_installer && !Entity.entityIsSingle() && !Entity.is_child && !entitiesApp[Entity.name]) {
          const fields = Entity.writableFieldsList().map(field => field.data.name);

          const filters = {
            "!=": { name: "Entity" },
            ...(fields.includes("app_name") ? {"and": { "=": { app_name: this.name } }} : {}),
            ...(Entity.name === "App" ? {"and": { "=": { name: this.name } }} : {})
          };

          const entityDocuments = await loopar.db.getAll(
            Entity.name,
            fields,
            filters,
            {isSingle: Entity.entityIsSingle()}
          );

          for (const doc of entityDocuments.sort((a, b) => a.id - b.id)) {
            if (!loopar.getRef(doc.name) && !ent.documents.find(d => d.id == doc.id)){
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
        entitiesApp[baseEntity].documents.push(ent);
      }
    }

    for (const e of entities.filter(e => e.__APP__ != "Core")) {
      const baseEntity = e.__ENTITY__ || "Entity";
      if (e.__document_status__ !== "Deleted" && loopar.utils.compare(e.__ENTITY__ || "Entity", baseEntity) && entitiesApp[baseEntity]) {
        if (!entitiesApp[baseEntity].documents.find(doc => doc.id == e.id)) {
          entitiesApp[baseEntity].documents.push({
            id: e.id,
            name: e.name,
            path: e.entityRoot,
            requires: await this.buildRequires(await loopar.getDocument(baseEntity, e.name, null, false)),
          });
        }
      }
    }

    entitiesStructure.documents = Object.values(entitiesApp).sort((a, b) => a.id - b.id);

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