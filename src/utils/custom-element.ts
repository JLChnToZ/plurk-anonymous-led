import { resetGlobalRegex } from '.';
import { toKebab } from './kebab';

const commonPrefixPostfix = /(?:^(?:html))|(?:(?:custom)?(?:element|component|handler)$)/gi;
const tagNameMap = new Map<Function, string>([
  [window.HTMLAnchorElement, 'a'],
  [window.HTMLAppletElement, 'applet'],
  [window.HTMLAreaElement, 'area'],
  [window.HTMLAudioElement, 'audio'],
  [window.HTMLBaseElement, 'base'],
  [window.HTMLBaseFontElement, 'basefont'],
  [window.HTMLBodyElement, 'body'],
  [window.HTMLBRElement, 'br'],
  [window.HTMLButtonElement, 'button'],
  [window.HTMLCanvasElement, 'canvas'],
  [window.HTMLDataElement, 'data'],
  [window.HTMLDataListElement, 'datalist'],
  [window.HTMLDetailsElement, 'details'],
  [window.HTMLDialogElement, 'dialog'],
  [window.HTMLDirectoryElement, 'dir'],
  [window.HTMLDivElement, 'div'],
  [window.HTMLDListElement, 'dl'],
  [window.HTMLEmbedElement, 'embed'],
  [window.HTMLFieldSetElement, 'fieldset'],
  [window.HTMLFontElement, 'font'],
  [window.HTMLFormElement, 'form'],
  [window.HTMLFrameElement, 'frame'],
  [window.HTMLFrameSetElement, 'frameset'],
  [window.HTMLHeadElement, 'head'],
  [window.HTMLHRElement, 'hr'],
  [window.HTMLHtmlElement, 'html'],
  [window.HTMLIFrameElement, 'iframe'],
  [window.HTMLImageElement, 'img'],
  [window.HTMLInputElement, 'input'],
  [window.HTMLLabelElement, 'label'],
  [window.HTMLLegendElement, 'legend'],
  [window.HTMLLIElement, 'li'],
  [window.HTMLLinkElement, 'link'],
  [window.HTMLMapElement, 'map'],
  [window.HTMLMarqueeElement, 'marquee'],
  [window.HTMLMenuElement, 'menu'],
  [window.HTMLMetaElement, 'meta'],
  [window.HTMLMeterElement, 'meter'],
  [window.HTMLObjectElement, 'object'],
  [window.HTMLOListElement, 'ol'],
  [window.HTMLOptGroupElement, 'optgroup'],
  [window.HTMLOptionElement, 'option'],
  [window.HTMLOutputElement, 'output'],
  [window.HTMLParagraphElement, 'p'],
  [window.HTMLParamElement, 'param'],
  [window.HTMLPictureElement, 'picture'],
  [window.HTMLPreElement, 'pre'],
  [window.HTMLProgressElement, 'progress'],
  [window.HTMLScriptElement, 'script'],
  [window.HTMLSelectElement, 'select'],
  [window.HTMLSlotElement, 'slot'],
  [window.HTMLSourceElement, 'source'],
  [window.HTMLSpanElement, 'span'],
  [window.HTMLStyleElement, 'style'],
  [window.HTMLTableCaptionElement, 'caption'],
  [window.HTMLTableDataCellElement, 'td'],
  [window.HTMLTableElement, 'table'],
  [window.HTMLTableHeaderCellElement, 'th'],
  [window.HTMLTableRowElement, 'tr'],
  [window.HTMLTemplateElement, 'template'],
  [window.HTMLTextAreaElement, 'textarea'],
  [window.HTMLTimeElement, 'time'],
  [window.HTMLTitleElement, 'title'],
  [window.HTMLTrackElement, 'track'],
  [window.HTMLUListElement, 'ul'],
  [window.HTMLVideoElement, 'video'],
]);
const tagFor = new WeakMap<CustomElementConstructor, TagFor>();
const observeAttributesMap = new WeakMap<CustomElementConstructor, Map<string, AttributeMapping[]>>();

type ConvertibleTypes = 'string' | 'number' | 'boolean' | 'bigint' | 'json';

interface ObservedTypeMap extends TypeMap {
  json: any;
}

interface AttributeMapping {
  key: PropertyKey;
  type: keyof ObservedTypeMap;
  optional?: boolean;
}

interface TagFor {
  name: string;
  is?: string; 
}

interface TypedCustomElementConsturctor {
  new(...args: any[]): ICustomElement;
  readonly observedAttributes?: Iterable<string>;
}

function guessTagName(proto: HTMLElement): string {
  for (let o: object | null = proto; o != null; o = Object.getPrototypeOf(o)) {
    const tag = tagNameMap.get(o.constructor);
    if (tag != null) return tag;
  }
  throw new TypeError('No matching tag name.');
}

function assignAttribute(mappings: AttributeMapping[], target: any, value: string | null) {
  for(const mapping of mappings)
    try {
      const converted = convert(mapping.type, value);
      if(converted !== undefined)
        target[mapping.key] = converted;
      else if(mapping.optional)
        target[mapping.key] = undefined;
    } catch(e) {
      console.error(e);
    }
}

function convert(type: keyof ObservedTypeMap, value: string | null) {
  switch(type) {
    case 'boolean':
      return value != null;
    case 'string':
      if(value != null)
        return value;
      break;
    case 'number':
      if(value != null)
        return parseFloat(value);
      break;
    case 'bigint':
      if(value != null)
        return BigInt(value);
    case 'json':
      if(value != null)
        return JSON.parse(value);
      break;
  }
}

/** Wraps the custom element class with dynamic attribute observers and registers it. */
export function CustomElement(
  isExtends?: boolean,
): <T extends CustomElementConstructor>(constructor: T) => T;
export function CustomElement(
  name: string | null | undefined,
  isExtends?: string | null | boolean,
): <T extends CustomElementConstructor>(constructor: T) => T;
export function CustomElement<T extends CustomElementConstructor>(constructor: T): T;
export function CustomElement(
  target: CustomElementConstructor | string | boolean | null = null,
  ext: string | boolean | null = false,
) {
  switch(typeof target) {
    case 'function':
      const Class = target;
      target = null;
      return wrap(Class);
    case 'boolean':
      ext = target;
      target = null;
      break;
  }
  return wrap;
  function wrap(Class: TypedCustomElementConsturctor) {
    class WrappedClass extends Class implements ICustomElement {
      static get observedAttributes() {
        const manual = super.observedAttributes;
        const auto = observeAttributesMap.get(Class)?.keys();
        return manual != null && auto != null ? [...manual, ...auto] :
          manual != null ? manual : auto;
      }

      constructor(...args: any[]) {
        super(...args);
        const attr = observeAttributesMap.get(Class);
        if(attr)
          for(const [name, mapping] of attr)
            if(this.hasAttribute(name))
              assignAttribute(mapping, this, this.getAttribute('key'));
      }

      attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if(oldValue !== newValue) {
          const mapping = observeAttributesMap.get(Class)?.get(name);
          if(mapping) assignAttribute(mapping, this, newValue);
        }
        super.attributeChangedCallback?.(name, oldValue, newValue);
      }
    }
    const name = typeof target === 'string' ? target : toKebab(Class.name
      .trim()
      .replace(resetGlobalRegex(commonPrefixPostfix), '')
    );
    const is = ext === true ? guessTagName(Class.prototype) : ext || undefined;
    window.customElements.define(name, WrappedClass, { extends: is });
    tagFor.set(WrappedClass, { name, is });
    return Object.defineProperty(WrappedClass, 'name', {
      configurable: true, value: `Wrapped${Class.name}`,
    }) as CustomElementConstructor;
  }
}

/** Observes an attribute and assigns the new/initial value on changes. */
export function ObserveAttribute<T extends ConvertibleTypes>(name: string | null | undefined, type: T, optional: true):
  ((target: ICustomElement, key: PropertyKey, descriptor: TypedPropertyDescriptor<ObservedTypeMap[T] | undefined>) =>
    TypedPropertyDescriptor<ObservedTypeMap[T] | undefined>) &
  ((target: ICustomElement, key: PropertyKey) => void);
export function ObserveAttribute<T extends ConvertibleTypes>(name: string | null | undefined, type: T):
  ((target: ICustomElement, key: PropertyKey, descriptor: TypedPropertyDescriptor<ObservedTypeMap[T]>) =>
    TypedPropertyDescriptor<ObservedTypeMap[T]>) &
  ((target: ICustomElement, key: PropertyKey) => void);
export function ObserveAttribute(name?: string | null):
  ((target: ICustomElement, key: PropertyKey, descriptor: TypedPropertyDescriptor<string>) => TypedPropertyDescriptor<string>) &
  ((target: ICustomElement, key: PropertyKey) => void);
export function ObserveAttribute(name: string | null | undefined, type: keyof ObservedTypeMap = 'string', optional?: boolean) {
  return (target: ICustomElement, key: PropertyKey, property?: PropertyDescriptor): PropertyDescriptor | void => {
    const Class = target.constructor as CustomElementConstructor;
    const mapping: AttributeMapping = { key, type, optional };
    let mappings = observeAttributesMap.get(Class);
    if(!mappings)
      observeAttributesMap.set(Class, mappings = new Map());
    const attrName = name ?? toKebab(key.toString());
    const mappingList = mappings.get(attrName);
    if(mappingList)
      mappingList.push(mapping);
    else
      mappings.set(attrName, [mapping]);
    return property;
  };
}

/** Make the property reflects to the value of an attribute. */
export function ReflectAttribute<T extends ConvertibleTypes>(name?: string | null, type?: T) {
  return (target: ICustomElement, key: PropertyKey) => {
    const attrName = name ?? toKebab(key.toString());
    Object.defineProperty(target, key, type && type !== 'string' ? ({
      configurable: true,
      get() {
        return convert(type, this.getAttribute(attrName));
      },
      set(value) {
        if(type === 'boolean' ? !value : value == null)
          this.removeAttribute(attrName);
        else
          this.setAttribute(attrName, value.toString());
      },
    } as PropertyDescriptor & ThisType<ICustomElement>) : ({
      configurable: true,
      get() {
        return this.getAttribute(attrName);
      },
      set(value) {
        if(value == null)
          this.removeAttribute(attrName);
        else
          this.setAttribute(attrName, value);
      },
    } as TypedPropertyDescriptor<string | null | undefined> & ThisType<ICustomElement>));
  };
}

/** Get tag name for a custom element class if registered. */
export function getTagFor(constructor: CustomElementConstructor) {
  const result = tagFor.get(constructor);
  if(result) return result;
  const name = tagNameMap.get(constructor);
  if(name) return { name };
}
