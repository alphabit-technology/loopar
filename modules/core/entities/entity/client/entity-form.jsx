import FormContext from '$context/form-context'
import { Button } from '@/components/ui/button';
import { BrushIcon, EyeIcon, SaveIcon, ArrowBigRightDash } from 'lucide-react';
import React from 'react';

import { DocumentContext } from "@context/@/document-context";
import { DesignerContext } from "@context/@/designer-context";

const Sidebar = ({data}) => {
  return (
    <>
      
    </>
  );
}

const EntityFormContext = ({docRef, children, ...props}) => {
  const handleSave = () => {
    docRef.save();
  }

  return (
    <DocumentContext.Provider value={{handleSave}}>
      <DesignerContext.Provider 
        value={{}}
      >
       {children}
      </DesignerContext.Provider>
    </DocumentContext.Provider>
  )
}

export default class EntityForm extends FormContext {
  render() {
    return (
      <EntityFormContext docRef={this}>
        {super.render()}
      </EntityFormContext>
    )
  }

  getSidebar() {
    const { meta = {} } = this.state;
    const data = meta.data || {};

    return <Sidebar data={data} docRef={this}/>
  }

  /*getSidebarHeader() {
    return (
     <div className="p-0 pb-1 flex flex-row">
        <Button
         variant="secondary"
        >
          <SaveIcon className="pr-1"/>
          Save
        </Button>
        <Button
          variant="secondary"
        >
          <ArrowBigRightDash className="pr-1"/>
          Delete
        </Button>
      </div>
    )
  }*/
}