'use strict';

import ListContext from '@context/list-context'
import loopar from "loopar";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from '@card';
import {
  Avatar,
  AvatarFallback
} from "@cn/components/ui/avatar"

import {Badge} from "@cn/components/ui/badge";
import {Link} from "@link"
import {Button} from "@cn/components/ui/button";

import { PlusIcon, DownloadIcon, RefreshCcwDotIcon, FolderDownIcon, Trash2Icon, CheckCircle2Icon } from 'lucide-react';

export default class AppManagerView extends ListContext {
  onlyGrid = true;
  hasSearchForm = false;

  constructor(props) {
    super(props);
  }

  clone() {
    loopar.prompt({
      title: "Get App",
      label: "Enter the Github URL of the app you want to install",
      placeholder: "Github URL",
      ok: (gitRepo) => {
        loopar.method('App Manager', 'clone', { git_repo: gitRepo });
      },
      validate: (gitRepo) => {
        console.log(gitRepo);
        if (!gitRepo || gitRepo.length === 0) return loopar.throw("Please enter a valid Github URL");
        return true;
      },
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
                <h6 className='font-bold text-slate-500 dark:text-slate-400'>App Version: {app.version}</h6>
                <h6 className='font-bold text-slate-500 dark:text-slate-400'>Installed Version: {app.installed_version}</h6>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button
                variant={app.installed && app.installed_version === app.version ? "secondary" : "primary"}
                disabled={app.installed && app.installed_version === app.version}
                onClick={() => this.sendAppAction(app.name, !app.installed ? 'install' : 'reinstall')}
              >
                {!app.installed ? (
                  <><FolderDownIcon className="mr-2"/> Install</>
                ) : (
                  app.installed_version !== app.version ? <><RefreshCcwDotIcon className="mr-2"/> Update</> :
                  <><CheckCircle2Icon className="mr-2"/> Installed</>
                )}
              </Button>
            </div>
            <div className='flex justify-end'>
              {
                app.installed && (
                <Button
                  variant="destructive"
                  onClick={() => this.sendAppAction(app.name, 'uninstall')}
                >
                  <Trash2Icon/>
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
        params: { app_name: appName },
        body: { app_name: appName }
      });
    });
  }
}