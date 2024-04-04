'use strict';

import ListContext from '@context/list-context';
import loopar from '$loopar';
import fileManager from "@tools/file-manager";
import FilePreview from "@file-preview";
import FileUploader from "@file-uploader";
import {Button} from "@/components/ui/button";
import { UploadIcon } from 'lucide-react';
import {Link} from '$link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export default class FileManagerList extends ListContext {
  renderGrid = true;
  onlyGrid = false;
  hiddenColumns = ["id", "size", "type", "src", "previewSrc"];
  filesRefs = {};

  constructor(props) {
    super(props);

    typeof props.onlyGrid !== "undefined" && (this.onlyGrid = props.onlyGrid);
    this.state = {
      ...this.state,
      uploading: false,
    };
  }

  file(file) {
    return fileManager.getMappedFiles(file);
  }

  get mappedColumns() {
    return [
      {
        data: {
          label: "Name",
          name: "name",
          value: (row) => {
            const type = fileManager.getFileType(row);
            const icon = fileManager.getRenderedFileIcon(type);

            return (
              <Link className='flex flex-row' to={`update?documentName=${row.name}`}>
                <Avatar>
                  <AvatarImage src={`/uploads/thumbnails/${row.name}`} />
                  <AvatarFallback>{loopar.utils.avatar(row.name)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col items-start p-0 pl-3'>
                  {row.name}
                  <span className='text-gray-500'>{fileManager.getFileSize(row.size)}</span>
                </div>
              </Link>
            )
          }
        }
      }
    ];
  }

  get multiple() {
    return this.props.multiple !== 0;
  }

  gridTemplate(row, action, grid) {
    row.extention = row.name.split('.').pop();
    const file = this.file([row])[0];

    return (
      <FilePreview
        data={row}
        file={file}
        onSelect={(src) => {
          this.props.onSelect && this.props.onSelect(src);
        }}
        accept={this.props.accept || "/*"}
        multiple={this.props.multiple !== 0}
        docRef={this}
        grid={grid}
        ref={(ref) => {
          this.filesRefs[row.name] = ref;
        }}
      />
    );
  }

  render() {
    return super.render([
      this.state.uploading ? (
        <FileUploader
          data={{
            name: "file",
            label: "File",
            placeholder: "Select file",
            accept: "*",
            multiple: true,
          }}
          inModal={true}
          onUpload={() => {
            loopar.navigate("list");
          }}
          onClose={() => {
            this.setState({ uploading: false });
          }}
          buttons={[]}
        />) : null
    ]);
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    if (prevProps.meta.rows !== this.props.meta.rows) {
      this.setState({});
    }
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }

  getSelectedFiles() {
    return this.grid?.selectedRows || [];
  }

  getFiles() {
    return this.props.meta.rows;
  }

  primaryAction() {
    return (
      <Button
        variant="secondary"
        onClick={(e) => {
          e.preventDefault();
          this.setState({ uploading: true });
        }}
      >
        <UploadIcon className="pr-1" />
        Upload
      </Button>
    )
    /*return button({
      className: "btn btn-primary",
      type: "button",
      onClick: (e) => {
        e.preventDefault();
        this.setState({ uploading: true });
      }
    }, [
      i({ className: "fa fa-fw fa-plus" }),
      " Upload"
    ])*/
  }
}