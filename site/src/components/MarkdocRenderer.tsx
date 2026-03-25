import type { RenderableTreeNodes } from '@markdoc/markdoc'
import Markdoc from '@markdoc/markdoc'
import React from 'react'
import ApiReference from './ApiReference'
import Callout from './Callout'
import CodeBlock from './CodeBlock'

const components = {
  ApiReference,
  Callout,
  CodeBlock,
}

export default function MarkdocRenderer({ content }: { content: RenderableTreeNodes }) {
  return <>{Markdoc.renderers.react(content, React, { components })}</>
}
