import FormContext from '$context/form-context'
import DesignerForm from "$tools/designer-form";
import ElementEditor from "$tools/element-editor";
import loopar from "$loopar";
import { Button } from '@/components/ui/button';
import { BrushIcon, EyeIcon, SaveIcon, ArrowBigRightDash } from 'lucide-react';
import { useDocument } from '@custom-hooks';
import { useState,  } from 'react';
import { DocumentContext } from "@custom-hooks"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {useCookies} from "@services/cookie";

const Sidebar = ({data}) => {
  const document = useDocument();
  const sidebarOption = document.mode;

  return (
    <>
      <div className='flex pb-1'>
        <Button
          variant="secondary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            document.handleChangeMode()
          }}
        >
          {sidebarOption === "designer" ? <EyeIcon className="mr-2" /> : <BrushIcon className="mr-2" />}
          <span>{sidebarOption === "designer" ? "Preview" : "Design"}</span>
        </Button>
        <Button
          variant="secondary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            document.handleSave()
          }}
        >
          <SaveIcon className="mr-2" />
          <span>Save</span>
        </Button>
      </div>
      <Separator/>
      <ScrollArea 
        className="h-full w-full"
      >
        {
          ["designer", "preview"].includes(sidebarOption) ? 
          <DesignerForm
            data={data}
          /> :
          <ElementEditor
            connectedElement={document.editElement}
            key={document.editElement?.data?.key}  
          />
        }
      </ScrollArea>
    </>
  );
}

const DocumentFormContext = ({docRef, children, ...props}) => {
  const [mode, setMode] = useCookies("document-mode")// useState(loopar.utils.cookie.get("document-mode") || "preview");
  const [editElement, setEditElement] = useState(null);

  const handleChangeMode = (opt=null) => {
    const neMode = opt !== null ? opt
      : ["preview", "editor"].includes(mode) ? "designer"
        : "preview";

    handleSetMode(neMode);
  }

  const handleSetMode = (newMode) => {
    //loopar.utils.cookie.set("document-mode", newMode)
    setMode(newMode);
  }

  const handleSetEditElement = (element) => {
    handleSetMode("editor");
    setEditElement(element);
  }

  const handleSave = () => {
    docRef.save();
  }

  return (
    <DocumentContext.Provider value={{mode, handleChangeMode, editElement, handleSetEditElement, handleSave}}>
      {children}
    </DocumentContext.Provider>
  )
}

export default class DocumentForm extends FormContext {
  editingElement = false;

  render() {
    return (
      <DocumentFormContext docRef={this}>
        {super.render()}
      </DocumentFormContext>
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