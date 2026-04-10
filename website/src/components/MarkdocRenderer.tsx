import type { RenderableTreeNodes } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";
import React from "react";
import { cn } from "#/lib/utils";
import ApiReference from "./ApiReference";
import Callout from "./Callout";
import CodeBlock from "./CodeBlock";
import ExampleBlock from "./ExampleBlock";
import InstallCmd from "./InstallCmd";

const headingTypeClass: Record<number, string> = {
  1: "type-display-300",
  2: "type-heading-200",
  3: "type-heading-100",
  4: "type-label-200",
  5: "type-label-100",
  6: "type-heading-100",
};

function Heading({
  level,
  id,
  children,
  class: annotation,
}: {
  level: number;
  id?: string;
  children: React.ReactNode;
  class?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag
      id={id}
      className={cn(
        headingTypeClass[level] ?? "type-heading-100",
        "mt-8 mb-4 text-foreground",
        annotation,
      )}
    >
      {children}
    </Tag>
  );
}

function Paragraph({
  children,
  class: annotation,
}: {
  children: React.ReactNode;
  class?: string;
}) {
  return (
    <p className={cn("mb-4 type-body-200 text-muted-foreground", annotation)}>
      {children}
    </p>
  );
}

const components = {
  ApiReference,
  Callout,
  CodeBlock,
  ExampleBlock,
  Heading,
  InstallCmd,
  Paragraph,
};

export default function MarkdocRenderer({
  content,
}: {
  content: RenderableTreeNodes;
}) {
  return <>{Markdoc.renderers.react(content, React, { components })}</>;
}
