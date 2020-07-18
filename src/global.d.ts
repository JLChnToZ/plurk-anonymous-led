type DeepPartial<T> = {
  [P in keyof T]?:
    T[P] extends string | number | boolean | undefined | null | symbol ?
      T[P] :
    T[P] extends Array<infer U> ?
      Array<DeepPartial<U>> :
    T[P] extends ReadonlyArray<infer U> ?
      ReadonlyArray<DeepPartial<U>> :
    DeepPartial<T[P]>;
};

type KeyOfType<T, TargetType> = keyof {
  [K in keyof T]: T[K] extends TargetType ? T[K] : never;
};

type DomElement = Element;

type AssignableProperty<T, K extends keyof T> =
  (<R>() => R extends { [I in K]: T[I] } ? true : false) extends
  (<R>() => R extends { -readonly [I in K]: T[I] } ? true : false) ?
    T[K] extends string | number | boolean | symbol | Function ?
      T[K] :
    AssignableObject<T[K]> :
  never;
type AssignableObject<T> = {
  [K in keyof T]?: AssignableProperty<T, K>;
};

type AssignableDomElement<T extends HTMLElement> = {
  [K in keyof T]?:
    // Bypass readonly check
    T[K] extends CSSStyleDeclaration | DOMStringMap ?
      AssignableObject<T[K]> :
    AssignableProperty<T, K>;
} & {
  [attribute: string]: any;
};

interface ICustomElement extends HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

interface TypeMap {
  undefined: undefined;
  string: string;
  boolean: boolean;
  number: number;
  bigint: bigint;
  symbol: symbol;
  'function': Function;
  object: object | null;
}

declare namespace JSX {
  type Element = HTMLElement;
  type ElementClass = HTMLElement;
  type IntrinsicElementMap = {
    [tagName in keyof HTMLElementTagNameMap]: AssignableDomElement<HTMLElementTagNameMap[tagName]>;
  };
  interface IntrinsicElements extends IntrinsicElementMap {
    [tagName: string]: any;
  }
}
