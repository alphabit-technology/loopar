'use strict';

import ViewContext from '/gui/document/view-context.js'
import {avatar} from '/tools/helper.js';
import noData from "/components/common/no-data.js";
import {div, span, button, i, a, h5, label} from "/components/elements.js";
import {loopar} from "/loopar.js";

export default class AppManagerView extends ViewContext {
   constructor(props) {
      super(props);
   }

   render() {
      const apps = this.makeApps();
      this.addCustomActions();

      return super.render([
         apps.length > 0 ? div({className: "row"}, apps ) : div({}, React.createElement(no_data, {}))
      ]);
   }

   clone(){
      loopar.prompt({
         title: "Get App",
         label: "Enter the Github URL of the app you want to install",
         placeholder: "Github URL",
         ok: (git_repo) => {
            if (git_repo) {
               loopar.method('App Manager', 'clone', { git_repo: git_repo }).then(() => {
                  loopar.root_app.refresh();
               });
            } else {
               loopar.dialog({
                  type: "alert",
                  title: "Error",
                  message: "Please enter a valid Github URL",
               });
            }
         }
      });
   }

   addCustomActions() {
      this.addCustomAction('add_app', button({
         className: "btn btn-primary",
         type: "button",
         onClick: () => {
            loopar.navigate('/desk/core/App/create');
         }
      }, [
         i({ className: "fa fa-fw fa-plus" }),
         " Add App"
      ]));

      this.addCustomAction('get_app',  button({
         className: "btn btn-secondary",
         type: "button",
         onClick: () => {
            this.clone();
         },
      }, [
         i({className: "fa fa-fw fa-download"}),
         " Get App"
      ]));
   }

   makeApps() {
      const meta = this.props.meta;
      const apps = meta.apps || [];

      return apps.map(app => {
         return div({className: "col-lg-4"}, [
            div({className: "card"}, [
               div({className: "card-header border-0"}, [
                  div({className: "d-flex justify-content-between align-items-center"}, [
                     span({className: "badge bg-muted", title: "Enabled"}, [
                        span({className: "sr-only"}, app.installed ? "Installed" : "Uninstalled"),
                        i({className: `fa fa-fw fa-check-circle text-${app.installed ? 'teal' : 'red'}`})
                     ]),
                     div({className: "dropdown"}, [
                        button({
                           className: "btn btn-icon btn-light",
                           type: "button",
                           "data-toggle": "dropdown",
                           "aria-expanded": "false"
                        }, [
                           i({className: "fa fa-ellipsis-v"})
                        ]),
                        div({className: "dropdown-menu dropdown-menu-right"}, [
                           div({className: "dropdown-arrow"}),
                            a({
                              className: `dropdown-item ${app.valid_repo ? '' : 'disabled'}`,
                              href: "#",
                              onClick: () => this.send_app_action(app.name, 'pull'),
                              disabled: !app.valid_repo
                           }, "Pull and Update"),
                           a({
                              className: `dropdown-item ${app.valid_repo ? '' : 'disabled'}`,
                              href: "#",
                              onClick: () => this.send_app_action(app.name, 'push'),
                              disabled: !app.valid_repo
                           }, "Push to Github"),
                           app.valid_repo ? a({className: "dropdown-item", href: app.git_repo, _target: "blank"}, "View on Github") : null,
                        ])
                     ])
                  ])
               ]),
               div({className: "card-body text-center"}, [
                  a({className: `tile tile-lg bg-${app.installed ? 'purple' : 'red'} mb-2`}, avatar(app.name)),
                  h5({className: "card-title"}, [
                     a({className: "card-title", href: "#"}, app.info)
                  ])
               ]),
               div({className: "card-footer"}, [
                  div({className: "card-footer-item"}, [
                     button({
                        className: "btn btn-reset text-nowrap text-muted",
                        onClick: () => this.send_app_action(app.name, app.installed ? 'uninstall' : 'install'),
                     }, [
                        i({className: `fa fa-fw ${app.installed ? 'fa-trash text-danger' : 'oi oi-fork text-warning'} mr-1`}),
                        label(app.installed ? 'Uninstall' : 'Install')
                     ])
                  ]),
                  div({className: "card-footer-item"}, [
                     button({
                        className: "btn btn-reset text-nowrap text-muted",
                        disabled: !(app.installed && app.installed_version !== app.version),
                        onClick: () => this.send_app_action(app.name, 'reinstall')
                     }, [
                        i({className: "oi oi-loop-circular text-warning mr-2"}),
                        label(app.installed && app.installed_version !== app.version ? app.version : "Reinstall")
                     ])
                  ])
               ])
            ])
         ])
      });
   }

   send_app_action(app_name, action) {
      loopar.dialog({
         type: "confirm",
         title: "Confirm",
         message: `Are you sure you want to ${action} ${app_name}?`,
         ok: () => {
            loopar.http.send({
               action: `${action}`,
               params: {app_name: app_name, installing: true},
               body: {app_name},
               success: r => {
                  if (r && r.success) {
                     loopar.root_app.refresh().then(() => {
                        loopar.navigate('/developer/App%20Manager/view');
                     });

                     loopar.notify(r.message, action === 'uninstall' ? 'warning' : 'success');
                  }
               },
               error: r => {
                  console.log(r);
               }
            });
         }
      });
   }
}