import { Superise } from '.';

const commonPrefixPostfix = /(?:^(?:html))|(?:(?:custom)?(?:element|component|handler)$)/gi;
const camels = /(?<!^|-)(\p{Lu}|\d+)/gu;
const illegalTagChars = /[^\.0-9a-z-_\xC0-\xD6\xD8-\xF6\xF8-\u{037D}\u{037F}-\u{1FFF}\u{200C}-\u{200D}\u{203F}-\u{2040}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]+/gu;
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

function resetGlobalRegex(matcher: RegExp) {
  matcher.lastIndex = 0;
  return matcher;
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
    @Superise
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
    const name = typeof target === 'string' ? target : Class.name
      .trim()
      .replace(resetGlobalRegex(commonPrefixPostfix), '')
      .replace(resetGlobalRegex(camels), '-$1')
      .toLowerCase()
      .replace(resetGlobalRegex(illegalTagChars), '');
    const is = ext === true ? guessTagName(Class.prototype) : ext || undefined;
    window.customElements.define(name, WrappedClass, { extends: is });
    tagFor.set(WrappedClass, { name, is });
    return WrappedClass as CustomElementConstructor;
  }
}

/** Observes an attribute and assigns the new/initial value on changes. */
export function ObserveAttribute<T extends ConvertibleTypes>(name: string, type: T, optional: true):
  ((target: ICustomElement, key: PropertyKey, descriptor: TypedPropertyDescriptor<ObservedTypeMap[T] | undefined>) =>
    TypedPropertyDescriptor<ObservedTypeMap[T] | undefined>) &
  ((target: ICustomElement, key: PropertyKey) => void);
export function ObserveAttribute<T extends ConvertibleTypes>(name: string, type: T):
  ((target: ICustomElement, key: PropertyKey, descriptor: TypedPropertyDescriptor<ObservedTypeMap[T]>) =>
    TypedPropertyDescriptor<ObservedTypeMap[T]>) &
  ((target: ICustomElement, key: PropertyKey) => void);
export function ObserveAttribute(name: string):
  ((target: ICustomElement, key: PropertyKey, descriptor: TypedPropertyDescriptor<string>) => TypedPropertyDescriptor<string>) &
  ((target: ICustomElement, key: PropertyKey) => void);
export function ObserveAttribute(name: string, type: keyof ObservedTypeMap = 'string', optional?: boolean) {
  return (target: ICustomElement, key: PropertyKey, property?: PropertyDescriptor): PropertyDescriptor | void => {
    const Class = target.constructor as CustomElementConstructor;
    const mapping: AttributeMapping = { key, type, optional };
    let mappings = observeAttributesMap.get(Class);
    if(!mappings)
      observeAttributesMap.set(Class, mappings = new Map());
    const mappingList = mappings.get(name);
    if(mappingList)
      mappingList.push(mapping);
    else
      mappings.set(name, [mapping]);
    return property;
  };
}

/** Make the property reflects to the value of an attribute. */
export function ReflectAttribute<T extends ConvertibleTypes>(name: string, type?: T) {
  return (target: ICustomElement, key: PropertyKey): void => void Object.defineProperty(target, key, type && type !== 'string' ? ({
    configurable: true,
    get() {
      return convert(type, this.getAttribute(name));
    },
    set(value) {
      if(type === 'boolean' ? !value : value == null)
        this.removeAttribute(name);
      else
        this.setAttribute(name, value.toString());
    },
  } as PropertyDescriptor & ThisType<ICustomElement>) : ({
    configurable: true,
    get() {
      return this.getAttribute(name);
    },
    set(value) {
      if(value == null)
        this.removeAttribute(name);
      else
        this.setAttribute(name, value);
    },
  } as TypedPropertyDescriptor<string | null | undefined> & ThisType<ICustomElement>));
}

/** Get tag name for a custom element class if registered. */
export function getTagFor(constructor: CustomElementConstructor) {
  const result = tagFor.get(constructor);
  if(result) return result;
  const name = tagNameMap.get(constructor);
  if(name) return { name };
}
