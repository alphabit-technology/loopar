
'use strict';

import FormContext from '$context/list-context';
import { div, span, button, i, a, h5, label } from "/components/elements.js";
import { loopar } from '/loopar.js';

export default class DocumentHistoryForm extends FormContext {
  readOnly = true;
  canUpdate = false;
  hasHistory = false;
  /*constructor(props) {
    super(props);
  }

  render() {
    return super.render();
  }*/

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }

  setCustomActions() {
    super.setCustomActions();

    if (this.getValue("action") !== 'Deleted') return;

    this.setCustomAction('restore', button({
      className: "btn btn-primary",
      type: "button",
      onClick: () => {
        loopar.dialog({
          type: "confirm",
          title: "Confirm",
          message: "Are you sure you want to restore this version?",
          ok: () => {
            this.restore();
          }
        });
      }
    }, [
      i({ className: "fa fa-fw fa-plus" }),
      " Restore"
    ]));
  }

  restore() {
    if (this.getValue("action") !== 'Deleted') {
      loopar.notify("This version is not deleted.", "warning");
      return;
    }

    loopar.method('Document History', 'restore', { documentName: this.props.meta.__DOCUMENT_NAME__ }).then(() => {
      loopar.rootApp.refresh();
    });
  }

  save() {
    loopar.notify("This version is read only.", "warning");
  }
}