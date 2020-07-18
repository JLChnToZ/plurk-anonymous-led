declare module 'unicode-bidirectional' {
  export function resolve(codepoints: number[], paragraphlevel: number, automaticLevel?: boolean): number[];
  export function reorder(codepoints: number[], levels: number[]): number[];
  export function reorderPermutation(levels: number[], IGNORE_INVISIBLE?: boolean): number[];
  export function mirror(codepoints: number[], levels: number[]): number[];
  export namespace constants {
    export var mirrorMap: Map<string, string>;
    export var oppositeBracket: Map<string, string>;
    export var openingBrackets: Set<string>;
    export var closingBrackets: Set<string>;
  }
}