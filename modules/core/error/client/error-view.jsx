
'use strict';

import ViewContext from '$context/view-context';
import Link from '@link';
import { HomeIcon } from 'lucide-react';

export default class ErrorView extends ViewContext {
  constructor(props) {
    super(props);
  }

  render() {
    const data = this.props.meta.__DOCUMENT__;
    return (
      <div className="grid grid-cols-1 place-items-center w-full pt-10">
        <img width={500} src={`/assets/images/illustration/${data.code || '500'}.svg`} alt="" />

        <h1 className="text-4xl p-4 text-red-400">Error: {data.code || "Oops! Something went wrong"}</h1>
        <p className="">{data.description || "We are sorry, but it seems that an error has occurred. Please try again later."}</p>
      </div>
    );
  }
}