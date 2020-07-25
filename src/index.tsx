import 'whatwg-fetch';
import moment from 'moment';
import h from './utils/jsx-helper';
import { reorder as reorderUBidi, resolve as resolveUBidi } from 'unicode-bidirectional';
import { qrcodegen } from './third-parties/qrcodegen';
import { LedDisplay } from './led';
import { bmFont } from './res/unifont-glyph';
import { LedDisplayRegion } from './led/led-region';
import { getCodePoints, delay, Bind } from './utils';
import { anonymousPixelArt, pornPixelArt } from './res/pixel-art';
import { CustomElement, ObserveAttribute } from './utils/custom-element';

interface LEDDisplayRegionWithMaxWidth extends LedDisplayRegion {
  maxWidth?: number;
}

interface Entry {
  text: string;
  id: string;
  porn?: boolean;
}

const dummyEntry: Entry = {
  text: '載入中…',
  id: '',
};

@CustomElement('anonymous-led')
export default class LEDAnonymous extends HTMLElement implements ICustomElement {
  private alink: HTMLAnchorElement;
  private shadow: ShadowRoot;
  private led: LedDisplay;
  private ledFill: LEDDisplayRegionWithMaxWidth;
  private ledPxArt: LEDDisplayRegionWithMaxWidth;
  private ledPxArt2: LEDDisplayRegionWithMaxWidth;
  private ledTime: LEDDisplayRegionWithMaxWidth;
  private ledScroll: LEDDisplayRegionWithMaxWidth;
  private ledQr: LEDDisplayRegionWithMaxWidth;
  private current = dummyEntry;
  private nextText: Entry[] = [];
  private isLoading?: boolean;
  private lastUpdateTime = 0;
  private timeText?: string;
  private firstRun = true;
  private _srcUrl?: string;
  private _color?: string;
  private _dimColor?: string;
  private _backgroundColor?: string;

  @ObserveAttribute('src', 'string', true)
  get srcUrl() { return this._srcUrl; }
  set srcUrl(value: string | undefined) {
    this._srcUrl = value;
    if(!this.nextText.length) this.fetchData();
  }

  @ObserveAttribute('color')
  get color() {
    return this.led?.color ?? this._color ?? '';
  }
  set color(value: string) {
    if(this.led) this.led.color = value;
    else this._color = value;
  }

  @ObserveAttribute('dim-color')
  get dimColor() {
    return this.led?.dimColor ?? this._dimColor ?? '';
  }
  set dimColor(value: string) {
    if(this.led) this.led.dimColor = value;
    else this._dimColor = value;
  }

  @ObserveAttribute('bgcolor')
  get backgroundColor() {
    return this.led?.backgroundColor ?? this._backgroundColor ?? '';
  }
  set backgroundColor(value: string) {
    if(this.led) this.led.backgroundColor = value;
    else this._backgroundColor = value;
  }

  get lang() {
    return super.lang || 'zh-tw';
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.alink = this.shadow.appendChild(<a target="_blank" style={{ position: 'relative' }}>{
      this.led = <LedDisplay
        unscaledWidth={256}
        unscaledHeight={32}
        color={this.color}
        dimColor={this.dimColor}
        backgroundColor={this.backgroundColor}
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
          height: '100%',
        }}
      /> as LedDisplay
    }</a> as HTMLAnchorElement);
    this.srcUrl = this.getAttribute('src') || undefined;
    this.ledFill = this.led.createRegion();
    this.ledPxArt = this.led.createRegion({ originX: 1, width: 16, height: 16 });
    this.ledPxArt2 = this.led.createRegion({ originX: 18, width: 16, height: 16 });
    this.ledTime = this.led.createRegion({ originX: 35, width: -32, height: 16 });
    this.ledScroll = this.led.createRegion({ originY: 16, width: -32, height: 16 });
    this.ledQr = this.led.createRegion({ originX: -32, width: 32, height: 32 });
    this.ledFill.fill();
    this.fetchData().then(() => {
      this.firstRun = false;
      this.ledFill.clear();
      this.ledPxArt.draw(anonymousPixelArt, 0, 5);
    });
    setInterval(this.update, 60);
  }

  @Bind
  private update() {
    const time = Date.now();
    const timeDiff = time - this.lastUpdateTime;
    if(!this.firstRun) {
      this.ledScroll.offsetX += Math.max(-this.ledScroll.offsetX / 60, 1) * timeDiff / 20;
      if(!(this.ledScroll.offsetX < this.ledScroll.maxWidth! + this.ledScroll.width * 0.2))
        this.updateContent();
      this.updateTime();
    }
    this.lastUpdateTime = time;
  }

  private updateContent() {
    this.current = this.nextText.shift() || dummyEntry;
    this.ledScroll.clear();
    drawText(this.ledScroll, this.current.text);
    this.ledScroll.offsetX = Math.floor(-this.ledScroll.width * 1.2);
    if(this.current.id) {
      const link = `https://www.plurk.com/p/${this.current.id}`;
      this.alink.href = link;
      this.ledQr.clear();
      const qr = qrcodegen.QrCode.encodeText(link, qrcodegen.QrCode.Ecc.LOW);
      const data: boolean[][] = [];
      for(let y = 0; y < qr.size; y++) {
        const yy = data[y] || (data[y] = []);
        for(let x = 0; x < qr.size; x++)
          yy[x] = qr.getModule(x, y);
      }
      this.ledQr.draw(data, (this.ledQr.width - qr.size) / 2, (this.ledQr.height - qr.size) / 2);
    } else {
      this.alink.href = '';
      this.ledQr.clear();
    }
    if(this.current.porn)
      this.ledPxArt2.draw(pornPixelArt);
    else 
      this.ledPxArt2.clear();
    if(!this.nextText.length) this.fetchData();
  }

  private updateTime() {
    const newTimeText = moment().locale(this.lang).format('L dd LTS');
    if(newTimeText === this.timeText) return;
    this.timeText = newTimeText;
    this.ledTime.clear();
    drawText(this.ledTime, this.timeText);
    this.ledTime.offsetX = this.ledTime.maxWidth! - this.ledTime.width + 1;
  }

  private async fetchData() {
    if(this.isLoading) return;
    this.isLoading = true;
    while(true)
      try {
        if(!this.srcUrl) break;
        const data = await(await fetch(this.srcUrl)).json();
        for(const pid of data.pids as number[]) {
          const id = pid.toString(36);
          const { posted, content, content_raw, porn } = data[pid];
          this.nextText.push({
            id, porn,
            text: `(${moment(posted).locale(this.lang).format('LTS')}) ${this.formatText(content, content_raw)} - /p/${id}`,
          });
        }
        break;
      } catch(e) {
        console.error(e);
        await delay(5000);
      }
    this.isLoading = false;
  }

  formatText(str = '', rawStr = '') {
    return rawStr.replace(/[\r\n\s\t]+/g, ' ').trim();
  }
}

function drawText(region: LEDDisplayRegionWithMaxWidth, text: string, offsetX = 0, offsetY = 0) {
  const startOffset = offsetX;
  const codePoints = getCodePoints(text);
  text = String.fromCodePoint(...reorderUBidi(codePoints, resolveUBidi(codePoints, 0)));
  for(let i = 0; i < text.length; i++) {
    const glyph = bmFont.glyphs[text.charCodeAt(i) || 0] ?? bmFont.meta.properties?.defaultChar ?? bmFont.glyphs[0];
    if(glyph && glyph.boundingBox) {
      region.draw(glyph.bitmap, offsetX + glyph.boundingBox.x, offsetY + glyph.boundingBox.y + 2, true);
      offsetX += glyph.boundingBox.width;
    } else
      console.warn(`Glyph not found: U+${text.charCodeAt(i).toString(16).padStart(4, '0')} (${text.charAt(i)})`);
  }
  region.maxWidth = offsetX - startOffset;
}
