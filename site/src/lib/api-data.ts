import symbolsJson from '../../api-data/symbols.json'

export interface SymbolProperty {
  name: string
  type: string
  description: string
  optional: boolean
  defaultValue?: string
}

export interface SymbolParameter {
  name: string
  type: string
  description: string
  optional: boolean
}

export interface ApiSymbol {
  name: string
  kind: 'interface' | 'function' | 'component' | 'hook' | 'context'
  description: string
  filePath: string
  lineNumber: number
  typeText?: string
  properties?: SymbolProperty[]
  members?: string[]
  parameters?: SymbolParameter[]
  returnType?: string
  tags?: Record<string, string>
  defaultElement?: string
  stateType?: string
}

const symbols = symbolsJson as ApiSymbol[]

export function getSymbolByName(name: string): ApiSymbol | undefined {
  return symbols.find((s) => s.name === name)
}

export function getSymbolsByKind(kind: ApiSymbol['kind']): ApiSymbol[] {
  return symbols.filter((s) => s.kind === kind)
}

export function getAllSymbols(): ApiSymbol[] {
  return symbols
}

const symbolNames = new Set(symbols.map((s) => s.name))

export function isKnownSymbol(name: string): boolean {
  return symbolNames.has(name)
}
