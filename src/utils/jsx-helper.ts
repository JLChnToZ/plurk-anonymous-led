import { getTagFor } from './custom-element';

export type JSXCreateElement = <T extends CustomElementConstructor | string>(
  tagName: T,
  attributes?: (
    T extends CustomElementConstructor ? Partial<InstanceType<T>> & { [attribute: string]: any; } :
    T extends keyof HTMLElementTagNameMap ? AssignableDomElement<HTMLElementTagNameMap[T] & HTMLElement> :
    { [attribute: string]: any; }
  ),
  ...children: (Node | string | number | boolean)[]
) => (
  T extends CustomElementConstructor ? InstanceType<T> :
  T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement
);

export type MaybeElement<T extends HTMLElement> = T | AssignableDomElement<T> | HTMLElement;

interface AssignFnMap {
  [typeName: string]: (src: any, dest: any) => void;
}

function isSolidPrimitive(obj: unknown): obj is object;
function isSolidPrimitive(obj: any) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function');
}

function isIterable(obj: object): obj is Iterable<any>;
function isIterable(obj: any) {
  return typeof obj[Symbol.iterator] === 'function';
}

function isArrayLike(obj: object): obj is ArrayLike<any>;
function isArrayLike(obj: any) {
  return typeof obj.length === 'number';
}

function isEventListenerObject(obj: unknown): obj is EventListenerObject & AddEventListenerOptions;
function isEventListenerObject(obj: any) {
  return !!obj && typeof obj === 'object' && typeof obj.handleEvent === 'function';
}

function isNode(obj: unknown): obj is Node;
function isNode(obj: any) {
  if(!obj || typeof obj !== 'object')
    return false;
  while(obj) {
    if(obj.constructor?.name === 'Node')
      return true;
    obj = Object.getPrototypeOf(obj);
  }
  return false;
}

const assignFn: AssignFnMap = {
  CSSStyleDeclaration(src, dest: CSSStyleDeclaration) {
    if(!src) return;
    switch(typeof src) {
      case 'string':
        dest.cssText = src;
        break;
      case 'object':
        for(const key in src) {
          let value = src[key];
          let priority: string | undefined;
          switch(typeof value) {
            case 'string':
              const priorityIndex = value.indexOf('!');
              if(priorityIndex >= 0) {
                priority = value.substring(priorityIndex + 1);
                value = value.substring(0, priorityIndex);
              }
              break;
            case 'undefined':
              break;
            case 'object':
              if(!value) break;
            default:
              value = value.toString();
              break;
          }
          if(value)
            dest.setProperty(key.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase(), value, priority);
        }
        break;
    }
  },

  DOMStringMap(src, dest: DOMStringMap) {
    if(!isSolidPrimitive(src))
      return;
    Object.assign(dest, src);
  },

  DOMTokenList(src, dest: DOMTokenList) {
    if(!isSolidPrimitive(src))
      return;
    if(isIterable(src))
      for(const n of src)
        dest.add(n);
    else if(isArrayLike(src))
      for(let i = 0, l = src.length; i < l; i++)
        dest.add(src[i]);
  },
};

const empty = Object.freeze({});

function createBaseElement(document: Document, nameOrClass: string | CustomElementConstructor) {
  if(typeof nameOrClass === 'string')
    return document.createElement(nameOrClass);
  const info = getTagFor(nameOrClass);
  if(!info)
    throw new TypeError(`${nameOrClass.name} is not registered.`);
  return info.is ?
    document.createElement(info.is, { is: info.name }) :
    document.createElement(info.name);
}

function jsxCreateElement(this: Document, nameOrClass: string | CustomElementConstructor, attributes: any = empty, ...children: any[]): any {
  const element = createBaseElement(this, nameOrClass);
  for(const key in attributes) {
    const value: unknown = attributes[key];
    if(key in element) {
      const target: unknown = (element as any)[key];
      switch(typeof target) {
        case 'object':
        case 'function':
          const typeName = target?.constructor?.name;
          if(typeName) {
            assignFn[typeName]?.(value, target);
            break;
          }
        default:
          (element as any)[key] = value;
          break;
      }
      continue;
    }
    switch(typeof value) {
      case 'string':
        element.setAttribute(key, value);
        break;
      case 'number':
      case 'bigint':
        element.setAttribute(key, value.toString(10));
        break;
      case 'symbol':
        element.setAttribute(key, Symbol.keyFor(value) || value.toString() || key);
        break;
      case 'function':
        element.addEventListener(key, value as EventListener);
        break;
      case 'boolean':
        if(value) element.setAttribute(key, key);
        break;
      case 'undefined':
        break;
      case 'object':
      default:
        if(isEventListenerObject(value))
          element.addEventListener(key, value, value);
        else if(value)
          element.setAttribute(key, JSON.stringify(value));
        break;
    }
  }
  for(const child of children) {
    switch(typeof child) {
      case 'undefined':
        break;
      case 'object':
        if(!child) break;
        if(isNode(child)) {
          element.appendChild(
            child.ownerDocument !== this ?
              this.adoptNode(child.cloneNode(true)) :
            child.isConnected ?
              child.cloneNode(true) :
            child,
          );
          break;
        }
      default:
        element.appendChild(this.createTextNode(child.toString()));
        break;
    }
  }
  return element;
}

export default jsxCreateElement.bind(window.document) as JSXCreateElement;

export function getCreateElementFunction(document: Document): JSXCreateElement {
  return jsxCreateElement.bind(document);
}
