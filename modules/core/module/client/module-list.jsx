
'use strict';

import ListContext from '@context/list-context';
import { Card, CardHeader, CardDescription, CardContent, CardFooter} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge";
import { MenuIcon, EyeIcon, PencilIcon, PlusIcon } from 'lucide-react';
import {Link} from "@link"
import loopar from "$loopar";

export default class ModuleList extends ListContext {
  //onlyGrid = true;
  constructor(props) {
    super(props);
  }

  gridTemplate1(row, action){
    const color = loopar.bgColor(row.name);
    const Icon = action === "list" ? MenuIcon : action === "update" ? PencilIcon : EyeIcon;

    /*return (
      <div>
        <Card className="w-full min-w-[300px] p-0 m-0">
          <CardHeader>
            <CardDescription>
              <Badge
                variant="secondary"
                className="bg-secondary text-white"
              >
                {row.type}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="justify-left flex gap-3">
              <Avatar className={`rounded-3 h-14 w-14`} style={{ backgroundColor: color }}>
                <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{loopar.utils.avatar(row.name)}</AvatarFallback>
              </Avatar>
              <p>
                <h4>{row.name}</h4>
                <h6 className='font-bold text-slate-500 dark:text-slate-400'>{row.module}</h6>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link
              to={`${row.name}/${action}?documentName=${row.name}`}
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                this.deleteRow(row);
              }}
            >
              <Icon className='mr-2'/>
              {loopar.utils.Capitalize(action)}
            </Link>
            {
              (row.type === "Document" && row.is_single !== 1) && (
                <Link
                  to={`${row.name}/create`}
                  variant="outline"
                >
                  <PlusIcon className='mr-2'/>
                  Add
                </Link>
              )
            }
          </CardFooter>
        </Card>
      </div>
    )*/
  }
}