import { nextPowerOf2 } from '../utils';

export interface Meta {
  version?: string;
  name?: string;
  size?: Size;
  boundingBox?: BoundingBox;
  properties?: Properties;
  totalChars?: number;
}

export interface Size {
  points: number;
  resolutionX: number;
  resolutionY: number;
}

export interface BoundingBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Properties {
  fontDescent?: number;
  fontAscent?: number;
  defaultChar?: number;
}

export interface Glyph {
  name: string;
  code?: number;
  char?: string;
  scalableWidthX?: number;
  scalableWidthY?: number;
  deviceWidthX?: number;
  deviceWidthY?: number;
  boundingBox?: BoundingBox;
  bytes: number[];
  bitmap: boolean[][];
}

export interface Glyphs {
  [char: string]: Glyph;
}

export type GlyphBitmap = {
  width: number;
  height: number;
} & { [y: number]: boolean[] };

export interface WriteTextOptions {
  textRepeat?: number;
  kerningBias?: number;
}

export class BDF {
  meta: Meta = {};
  glyphs: Glyphs = {};

  constructor() {}

  toString() {
    let text = '';
    for(const glyph in this.glyphs)
      text += String.fromCharCode(parseInt(glyph));
    return text;
  }

  load(data: string) {
    if(!data)
      throw new Error('Couldn\'t understand this font');

    const fontLines = data.split(/[\r\n]+/g);
    const declarationStack: string[] = [];
    let currentChar: Glyph | null = null;
    const meta: Meta = {};

    for(let i = 0; i < fontLines.length; i++) {
      const data = fontLines[i].split(/\s+/);
      const [declaration] = data;

      switch(declaration) {
      case 'STARTFONT':
        declarationStack.push(declaration);
        meta.version = data[1];
        break;
      case 'FONT':
        meta.name = data[1];
        break;
      case 'SIZE':
        meta.size = {
          points: parseInt(data[1]) | 0,
          resolutionX: parseInt(data[2]) | 0,
          resolutionY: parseInt(data[3]) | 0,
        };
        break;
      case 'FONTBOUNDINGBOX':
        meta.boundingBox = {
          width: parseInt(data[1]) | 0,
          height: parseInt(data[2]) | 0,
          x: parseInt(data[3]) | 0,
          y: parseInt(data[4]) | 0
        };
        break;
      case 'STARTPROPERTIES':
        declarationStack.push(declaration);
        meta.properties = {};
        break;
      case 'FONT_DESCENT':
        meta.properties!.fontDescent = parseInt(data[1]) | 0;
        break;
      case 'FONT_ASCENT':
        meta.properties!.fontAscent = parseInt(data[1]) | 0;
        break;
      case 'DEFAULT_CHAR':
        meta.properties!.defaultChar = parseInt(data[1]) | 0;
        break;
      case 'ENDPROPERTIES':
        declarationStack.pop();
        break;
      case 'CHARS':
        meta.totalChars = +data[1];
        break;
      case 'STARTCHAR':
        declarationStack.push(declaration);
        currentChar = {
          name: data[1],
          bytes: [],
          bitmap: []
        };
        break;
      case 'ENCODING':
        currentChar!.code = parseInt(data[1]) | 0;
        currentChar!.char = String.fromCharCode(parseInt(data[1]) | 0);
        break;
      case 'SWIDTH':
        currentChar!.scalableWidthX = parseInt(data[1]) | 0;
        currentChar!.scalableWidthY = parseInt(data[2]) | 0;
        break;
      case 'DWIDTH':
        currentChar!.deviceWidthX = parseInt(data[1]) | 0;
        currentChar!.deviceWidthY = parseInt(data[2]) | 0;
        break;
      case 'BBX':
        currentChar!.boundingBox = {
          x: parseInt(data[3]) | 0,
          y: parseInt(data[4]) | 0,
          width: parseInt(data[1]) | 0,
          height: parseInt(data[2]) | 0
        };
        break;
      case 'BITMAP':
        for(let row = 0; row < meta.size!.points; row++, i++) {
          const byte = parseInt(fontLines[i + 1], 16);
          currentChar!.bytes.push(byte);
          currentChar!.bitmap[row] = [];
          for(let bit = 0, hint = nextPowerOf2(currentChar!.boundingBox!.width); bit <= hint; bit++)
            currentChar!.bitmap[row][hint - bit] = !!(byte & (1 << bit));
        }
        break;
      case 'ENDCHAR':
        declarationStack.pop();
        this.glyphs[currentChar!.code!] = currentChar!;
        currentChar = null;
        break;
      case 'ENDFONT':
        declarationStack.pop();
        break;
      }
    }

    this.meta = meta;
    if(declarationStack.length)
      throw new Error('Couldn\'t correctly parse font');
  }

  writeText(text: string, options?: WriteTextOptions, _bitmap?: GlyphBitmap): GlyphBitmap {
    options = options || {};
    if(!options.textRepeat) options.textRepeat = 0;
    if(!options.kerningBias) options.kerningBias = 0;
    const { textRepeat, kerningBias } = options;
    const points = this.meta!.size!.points!;
    const fontDescent = this.meta!.properties!.fontDescent!;
    if(!_bitmap) {
      _bitmap = { width: 0, height: points };
      for(let row = 0; row < points; row++)
        _bitmap[row] = [];
    }

    for(let i = 0; i < text.length; i++) {
      const charCode = text[i].charCodeAt(0);
      const glyphData = this.glyphs[charCode];
      if(!glyphData) {
        console.error(`Could not found character ${charCode}`);
        continue;
      }
      for(let y = 0, bm = glyphData.bitmap, by = bm.length; y < by; y++) {
        for(let x = 0, bx = bm[y].length; x < bx; x++) {
          const row = y + glyphData.boundingBox!.y + fontDescent;
          const column = x + glyphData.boundingBox!.x + _bitmap.width;
          _bitmap[row][column] = _bitmap[row][column] || glyphData.bitmap[y][x];
        }
      }
      _bitmap.width += glyphData.deviceWidthX! + kerningBias;
    }

    if(textRepeat > 0) {
      options.textRepeat!--;
      return this.writeText(text, options, _bitmap);
    }

    return _bitmap;
  }
}
