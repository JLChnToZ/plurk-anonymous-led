# Minimistic Custom HTML Element Decorators And JSX Helpers
This is a set of helpers for simplifying creating custom HTML elements.
This is not a framework and only provides minimistic helpers/decorators.

## Getting Started
Before you using decorators, you will have to set `experimentalDecorators` to `true` in tsconfig.json:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

### Create Custom Elements
To create an autonomous custom element (element with custom tag names):
```ts
import { CustomElement } from './custom-element';

// This decorator will wraps the class with additional helpers and registers it.
@CustomElement('my-element')
export class MyElement extends HTMLElement {
  constructor() {
    super();
  }

  // ...
  // Just implement your class as you will with standard custom elements.
}
```
You may omit the tag name and it will attempt to guess the tag name by your class name.
But have a mind that it may not work as expected if you minify or obfuscate your code.

Or a customized built-in element (element with built-in tags, but in your own extended behaviour):
```ts
import { CustomElement } from './custom-element';

@CustomElement('my-paragraph-element', true)
export class MyParagraphElement extends HTMLParagraphElement { /*...*/ }
```

But if your base element class is shared by multiple tags, like `HTMLHeaderElement` for `<h1>` ~ `<h6>`,
you will have to explicit define the tag name you want to registers to. Like this:
```ts
@CustomElement('my-header-element', 'h1')
export class MyHeaderElement extends HTMLHeaderElement { /*...*/ }
```
Have a mind that each class can be only be registered to one single tag.

### Manipulating Attributes
To observe an attribute:
```ts
import { CustomElement, ObserveAttribute } from './custom-element';

@CustomElement('my-element')
class MyElement extends HTMLElement {
  private _someAttribute: string = '';
  private _someNumber?: number;

  @ObserveAttribute('some-attribute')
  get someAttribute() { return this._someAttribute; }
  set someAttribute(value: string) {
    this._someAttribute = value;
    // You may add your handler logic here
  }

  // You need to explicit define the type if it is not string.
  // Types supported: `boolean`, `number`, `string`, `bigint`, `json`
  // If the property is optional (nullable), set the third parameter to `true`.
  @ObserveAttribute('some-number', 'number', true)
  get someNumber() { return this._someNumber; }
  set someNumber(value?: number) {
    this._someNumber = value;
  }

  // The attribute can be non dynamic property,
  // The value will be assigned once updated.
  @ObserveAttribute('some-string')
  someString?: string;
}
```

To make an attribute shortcut:
```ts
import { CustomElement, ReflectAttribute } from './custom-element';

@CustomElement('my-element')
class MyElement extends HTMLElement {
  @ReflectAttribute('some-element')
  private someElement?: string;

  // For types other than string, you need to explicit define it.
  @ReflectAttribute('some-number', 'number')
  private someNumber?: number;
}
```
If attribute names are omitted, it will guess the attribute names in similar way as for the tag names.
This shortcut must be define with non dynamic properties or the getter/setter will be overwritten.


### Create Tree of Elements Using JSX Style Logic
In this toolset, we have also provided helpers for creating elements using JSX style logic.
This does not contains any logic flow that works like React but only creating elements into real DOM.

Before you using these helpers, you will have to set the following properties in tsconfig.json:
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h"
  }
}
```

Also, every source file that contains JSX syntax, the extension will have to be `.tsx` instead of `.ts`.

To create a tree:
```tsx
import h from './jsx-helper';

// ...

// Assume MyElement is a registered custom element class.
const someElement = <a href="https://example.com">
  <MyElement />
</a> as HTMLAnchorElement;
```
Because there has limitation on resolving type after creation, you will have to add `as SomeElement` to the end of the JSX syntax.
