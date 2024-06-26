import ListContext from '$context/list-context';
import loopar from "$loopar";

import { Card, CardHeader, CardDescription, CardContent, CardFooter} from '@card';
import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge";
import { MenuIcon, EyeIcon, PlusIcon, PencilIcon, BrushIcon } from 'lucide-react';
import {Link} from "@link"

export default class DocumentList extends ListContext {
  cardSize = 230;
  hiddenColumns = ["is_single"];
  constructor(props) {
    super(props);
  }

  onShow() {
    super.onShow();
  }

  onLoad() {

  }

  gridTemplate(row, action){
    const color = loopar.bgColor(row.name);
    const Icon = action === "list" ? MenuIcon : action === "update" ? BrushIcon : EyeIcon;

    const getAction = (to, Icon, text, variant) => {
      return (
        <Link
          to={to}
          variant="outline"
        >
          <Icon className="mr-2"/>
          {text}
        </Link>
      )
    }
    
    return (
      <div>
        <Card className="w-full min-w-[300px] -p-5">
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
              <div>
                <h4>{row.name}</h4>
                <h6 className='font-bold text-slate-500 dark:text-slate-400'>{row.module}</h6>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {action === "list" && getAction(`/desk/${row.module}/${row.name}/${action}`, Icon, loopar.utils.Capitalize(action), "primeblue")}
              {action === "view" && getAction(`/desk/${row.module}/${row.name}/${action}?documentName=${row.name}`, Icon, loopar.utils.Capitalize(action), "primeblue")}
            </div>
            <div className='flex justify-end'>
              <Link 
                to={`/desk/core/document/update?documentName=${row.name}`}
                variant="outline"
                className="bg-warning/60"
              >
                <BrushIcon/>
              </Link>
              {
                (row.type === "Document" && row.is_single !== 1) && (
                  <Link
                    to={`/desk/${row.module}/${row.name}/create`}
                    variant="outline"
                    className="bg-success/60"
                  >
                    <PlusIcon/>
                  </Link>
                )
              }
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }
}