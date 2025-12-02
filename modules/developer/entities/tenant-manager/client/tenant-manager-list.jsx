
'use strict';

import ListContext from '@context/list-context';
import loopar from "loopar";
import React, {useState, useRef } from "react";
import DragToggle from "./DragToggle.jsx";
import { Code, Star } from 'lucide-react';

import {
  Avatar,
} from "@cn/components/ui/avatar"

import {Badge} from "@cn/components/ui/badge";
import {Link} from "@link"
import {Button} from "@cn/components/ui/button";
import { StopCircle, Settings2Icon, EllipsisIcon, HardDrive, PlayCircle, RefreshCcwDot, CircleDot, Code2Icon, StarIcon } from 'lucide-react';

import {cn} from "@cn/lib/utils";

import { useDialogContext} from "@dialog";
import { useTable } from "@@table/TableContext"

const tenantStatus = (row) => {
  return row.status != "online" || process.env.TENANT_ID == row.name;
}

const NameRender = ({row}) => {
  const {inDialog} = useDialogContext();
  const {toggleRowSelect} = useTable();
  const Com = inDialog ? "a" : Link;
  const disabled = tenantStatus(row);

  const compPropperties = inDialog ? {
    onClick: (e) => {
      e.preventDefault();
      toggleRowSelect(row);
    }
  } : {}

  const to = row.domain ? `http://${row.domain}/desk` : `http://localhost:${row.port}/desk`;

  return (
    <Com 
      className={cn(
        "flex flex-row",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none disabled"
      )}
      to={to} 
      target="_blank" 
      {...compPropperties}
    >
      <Avatar>
        <div>
          <HardDrive
            className={
              cn(
                `w-8 h-8 transition-all ease-in duration-300 hover:scale-105 aspect-square`,
                row.status == "online" ? "text-green-500/70" : "text-red-500/70"
              )
            }
          />
        </div>
      </Avatar>
      <div className='flex flex-col items-start p-0 pl-3'>
        {row.name.toUpperCase()}
        <span className='text-gray-500'>{to}</span>
      </div>
    </Com>
  )
}

const sendAction = (action, name, confirm=true) => {
  const doAction = () => {
    loopar.method("Tenant Manager", action, {
      name: name
    }, {
      success: () => {
        loopar.refresh();
      },
      error: (message) => {
        loopar.throw(message);
      },
    });
  }

  if(confirm){
    loopar.confirm(`Are you sure you want to ${action} ${name}?`, () => {
      doAction(action, name);
    });
  }else{
    doAction(action, name)
  }
}

const Buttons = ({row}) => {
  const {inDialog} = useDialogContext();

  if(inDialog) {
    return null
  }

  const status = row.status;
  const action = status == "online" ? "stop" : "start";

  
  
  return (
    <div className="flex flex-row items-center gap-0">
      <Button
        variant="outline"
        disabled={row.name == process.env.TENANT_ID || row.name == "core" || status != "online"}
        onClick={(e) => {
          e.preventDefault();
          sendAction("restart", row.name);
        }}
      >
        <RefreshCcwDot className="text-orange-500/50" />
      </Button>
      <Link
        to={`update?name=${row.name}&app=${row.app}`}
      >
        <Button variant="outline">
          <Settings2Icon className="text-blue-500" />
        </Button>
      </Link>
    </div>
  );
}

export default class TenantManagerList extends ListContext {
  onlyList=true;
    constructor(props){
        super(props);
    }

    customColumns(baseColumns) {
      return [
        {
          data: {
            name: "name:"
          },
          render: row => (
            <NameRender row={row} />
          ),
        },
        {
          data: {
            name: "node_env:",
            label: "Mode"
          },
          headProps: {
            className: "w-10 p-2 text-center",
          },
          cellProps: {
            className: "w-10 p-2 text-center",
          },
          render: row => {
            const mode = row.node_env;
   
            return (
              <DragToggle 
                value={mode == "production"}
                disabled={row.name == process.env.TENANT_ID || row.name == "core"}
                onChange={(isProduction) => {
                  sendAction(isProduction ? "production" : "development", row.name, false);
                }}
                offLabel="Dev"
                onLabel="Prod"
                OffIcon={Code}
                OnIcon={Star}
                offColor="amber"
                onColor="blue"
              />
            )
          }
        },
        {
          data: {
            name: "status:",
            label: "Status"
          },
          headProps: {
            className: "w-10 p-2 text-center",
          },
          cellProps: {
            className: "w-10 p-2 text-center",
          },
          render: row => {
            const status = row.status;
            
            return (
              <DragToggle 
                value={status=="online"}
                disabled={row.name == process.env.TENANT_ID || row.name == "core"}
                onChange={(isOnline) => {
                  sendAction(isOnline ? "start" : "stop", row.name, false);
                }}
              />
            )
          }
        },
        ...baseColumns,
        {
          data: {
            label: () => <EllipsisIcon className="w-full"/>,
            name: "actions",
          },
          headProps: {
            className: "w-10 p-2 text-center",
          },
          render: row => (
            <Buttons row={row} />
          ),
        }
      ];
    }
}