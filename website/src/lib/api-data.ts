export interface SymbolProperty {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

export interface SymbolParameter {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export interface ApiSymbol {
  name: string;
  kind: "interface" | "function" | "component" | "hook" | "context";
  description: string;
  filePath: string;
  lineNumber: number;
  typeText?: string;
  properties?: SymbolProperty[];
  members?: string[];
  parameters?: SymbolParameter[];
  returnType?: string;
  tags?: Record<string, string>;
  defaultElement?: string;
  stateType?: string;
}
