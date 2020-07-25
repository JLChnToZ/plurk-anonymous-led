export function delay(timeout: number): Promise<void>;
export function delay<T>(timeout: number, value: T): Promise<T extends PromiseLike<infer P> ? P : T>;
export function delay(timeout: number, value?: unknown) {
  return new Promise(resolve => setTimeout(resolve, timeout, value));
}

export function getCodePoints(str: string) {
  const chars: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c1 = str.charCodeAt(i);
    if (c1 >= 0xD800 && c1 < 0xDC00 && i + 1 < str.length) {
      let c2 = str.charCodeAt(i + 1);
      if (c2 >= 0xDC00 && c2 < 0xE000) {
        chars.push(0x10000 + ((c1 - 0xD800) << 10) + (c2 - 0xDC00));
        i++;
        continue;
      }
    }
    chars.push(c1);
  }
  return chars;
}

export function nextPowerOf2(v: number) {
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v |= v >> 32;
  return v + 1;
}

export function resetGlobalRegex(matcher: RegExp) {
  matcher.lastIndex = 0;
  return matcher;
}

export var Bind: MethodDecorator = (target, key, descriptor) => {
  const Type: NewableFunction = target.constructor;
  if(descriptor.get || descriptor.set)
    throw new TypeError(
      `${Type.name}.${key.toString()} ` +
      'has already defined a getter/setter, ' +
      'which is not suppported to use decorator to bind it, ' +
      'consider to manually use Function.bind() in the getter/setter.',
    );
  let orgValue = descriptor.value;
  const { writable, enumerable } = descriptor;
  descriptor.get = function(this: Object) {
    if(this === target) return orgValue;
    const value = typeof orgValue === 'function' ?
      Function.prototype.bind.call(orgValue, this) :
      orgValue;
    for(let o = this; o instanceof Type; o = Object.getPrototypeOf(o))
      if(Object.prototype.hasOwnProperty.call(o, key))
        return value;
    Object.defineProperty(this, key, {
      value, configurable: true, writable, enumerable,
    });
    return value;
  };
  if(writable) {
    descriptor.set = function(this: Object, value: any) {
      if(this === target) return orgValue = value;
      Object.defineProperty(this, key, {
        value, configurable: true, writable: true, enumerable: true,
      });
    };
    delete descriptor.writable;
  }
  delete descriptor.value;
  return descriptor;
};
