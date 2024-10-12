'use strict';

import ListContext from '@context/list-context'
import loopar from "loopar";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from '@card';
import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar"

import {Badge} from "@/components/ui/badge";
import {Link} from "@link"
import {Button} from "@/components/ui/button";

import { PlusIcon, DownloadIcon, MenuIcon, RefreshCcwDotIcon, FolderDownIcon, Trash2Icon, CheckCircle2Icon } from 'lucide-react';

export default class AppManagerView extends ListContext {
  onlyGrid = true;
  hasSearchForm = false;

  constructor(props) {
    super(props);
  }

  /*render() {
    const apps = this.makeApps();
    return super.render(
      <div className='flex flex-row'>
        {apps.length > 0 ? apps : <noData/>}
      </div>
    );
  }*/

  clone() {
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

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }

  setCustomActions() {
    super.setCustomActions();

    this.setCustomAction('addApp', <Link
      variant="secondary"
      className="bg-success text-white hover:bg-success/80"
      to="/desk/App/create"
    >
      <PlusIcon className="mr-2"/> Add App
    </Link>);

     this.setCustomAction('getApp', <Button
      variant="primeblue"
      onClick={(e) => {
        e.preventDefault();
        this.clone();
      }}
    >
      <DownloadIcon className="mr-2"/> Get App
    </Button>);
  }

  gridTemplate(app){
    const color = loopar.bgColor(app.name);
    
    return (
      <div>
        <Card className="w-full min-w-[300px] p-2">
          <CardHeader>
            <CardTitle>{app.name}</CardTitle>
            <CardDescription>
              <Badge
                className={`${app.installed ? 'bg-success' : 'bg-danger'} text-white`}
              />
              {app.info}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="justify-left flex gap-3">
              <Avatar className={`rounded-3 h-14 w-14`} style={{ backgroundColor: color }}>
                <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{loopar.utils.avatar(app.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h4>Autor: {app.autor}</h4>
                <h6 className='font-bold text-slate-500 dark:text-slate-400'>Installed Version: {app.version}</h6>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button
                variant={app.installed ? "success" : "warning"}
                //className={`${app.installed ? 'bg-success ' : 'bg-warning text-white'}`}
                disabled={app.installed}
                onClick={() => this.sendAppAction(app.name, 'install')}
              >
                {app.installed ? (
                  <><CheckCircle2Icon className="mr-2"/> Installed</>
                ) : (
                  <><FolderDownIcon className="mr-2"/> Install</>
                )}
              </Button>
              {app.installed && app.installed_version !== app.version && (
                <Button
                  variant="outline"
                  onClick={() => this.sendAppAction(app.name, 'reinstall')}
                >
                  <RefreshCcwDotIcon className="mr-2"/> Reinstall
                </Button>
              )}
            </div>
            <div className='flex justify-end'>
              {
                app.installed && (
                <Button
                  variant="outline"
                  className="bg-danger text-white"
                  onClick={() => this.sendAppAction(app.name, 'uninstall')}
                >
                  <Trash2Icon/>
                </Button>)
              }
              {
                app.installed && app.installed_version !== app.version && (
                <Button
                  variant="outline"
                  onClick={() => this.sendAppAction(app.name, 'reinstall')}
                >
                  <RefreshCcwDotIcon/>
                </Button>)
              }
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  makeApps() {
    const meta = this.props.meta;
    const apps = meta.apps || [];

    return apps.map(app => {
      const color = loopar.bgColor(app.name);
      return (
      <div>
        <Card className="w-full min-w-[300px] p-2">
          <CardHeader>
            <CardDescription>
              <Badge
                variant="secondary"
                className="bg-secondary text-white"
              >
                {app.name}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="justify-left flex gap-3">
              <Avatar className={`rounded-3 h-14 w-14`} style={{ backgroundColor: color }}>
                <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{loopar.utils.avatar(app.name)}</AvatarFallback>
              </Avatar>
              <p>
                <h4>{app.name}</h4>
                <h6 className='font-bold text-slate-500 dark:text-slate-400'>{app.info}</h6>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className='flex justify-end'>

            </div>
          </CardFooter>
        </Card>
      </div>
    )});
  }

  sendAppAction(appName, action) {
    const deleteMessage = action === "uninstall" ? `<br/><br/><span class='fa fa-circle text-red pr-2'></span> <strong class='text-red'>All data and Documents related to ${appName} will be deleted.</strong>` : '';
    loopar.confirm(`Are you sure you want to ${action} ${appName}?${deleteMessage}`, () => {
      loopar.send({
        action: `${action}`,
        params: { app_name: appName, installing: true },
        body: { app_name: appName }
      });
    });
  }
}