
'use strict';
import Entity from "../../entities/entity/entity.js";
import { loopar } from "loopar";

export default class EntityBuilder extends Entity {
  type = "Entity";

  constructor(props) {
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module, "entities");
  }
}