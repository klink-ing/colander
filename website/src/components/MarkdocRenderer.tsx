import type { RenderableTreeNodes } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";
import React from "react";
import ApiReference from "./ApiReference";
import Callout from "./Callout";
import CodeBlock from "./CodeBlock";
import ExampleBlock from "./ExampleBlock";
import InstallCmd from "./InstallCmd";

const components = {
  ApiReference,
  Callout,
  CodeBlock,
  ExampleBlock,
  InstallCmd,
};

export default function MarkdocRenderer({ content }: { content: RenderableTreeNodes }) {
  return <>{Markdoc.renderers.react(content, React, { components })}</>;
}
