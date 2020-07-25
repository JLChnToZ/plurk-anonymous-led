import color from 'color';
import LedWorker from 'worker-loader?inline=true&fallback=false!./led.worker';
import { LedDisplayRegion, LedDisplayRegionOptions } from './led-region';
import { Bind } from '../utils';
import { CustomElement, ObserveAttribute } from '../utils/custom-element';
import { TransferCanvas, Clear, DataType, UpdateCanvas, Focus } from './led.common';

@CustomElement('led-display', true)
export class LedDisplay extends HTMLCanvasElement implements ICustomElement {
  private worker = new LedWorker();
  private _unscaledWidth?: number;
  private _unscaledHeight?: number;
  private _scale?: number;
  private _color?: string;
  private _dimColor?: string;
  private _backgroundColor?: string;
  private _padding?: number;
  private regions: LedDisplayRegion[] = [];

  @ObserveAttribute('unscaled-width', 'number')
  get unscaledWidth() { return this._unscaledWidth ?? 88; }
  set unscaledWidth(value: number) {
    this._unscaledWidth = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      unscaledWidth: this.unscaledWidth,
    } as UpdateCanvas);
  }

  @ObserveAttribute('unscaled-height', 'number')
  get unscaledHeight() { return this._unscaledHeight ?? 31; }
  set unscaledHeight(value: number) {
    this._unscaledHeight = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      unscaledHeight: this.unscaledHeight,
    } as UpdateCanvas);
  }

  @ObserveAttribute('scale', 'number')
  get scale() { return this._scale ?? 4; }
  set scale(value: number) {
    this._scale = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      scale: this.scale,
    } as UpdateCanvas);
  }

  @ObserveAttribute('padding', 'number')
  get padding() { return this._padding ?? 1; }
  set padding(value: number) {
    this._padding = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      padding: this.padding,
    } as UpdateCanvas);
  }

  @ObserveAttribute('color')
  get color() { return this._color || 'rgba(255, 128, 0, 0.75)'; }
  set color(value: string) {
    this._color = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      color: this.color,
      dimColor: this.dimColor,
    } as UpdateCanvas);
  }

  @ObserveAttribute('dim-color')
  get dimColor() { return this._dimColor || color(this.color).darken(0.8).fade(0.5).string(); }
  set dimColor(value: string) {
    this._dimColor = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      dimColor: this.dimColor,
    } as UpdateCanvas);
  }

  @ObserveAttribute('bgcolor')
  get backgroundColor() { return this._backgroundColor || 'rgba(0, 0, 0, 0.25)'; }
  set backgroundColor(value: string) {
    this._backgroundColor = value;
    this.worker.postMessage({
      type: DataType.updateCanvas,
      backgroundColor: this.backgroundColor,
    } as UpdateCanvas);
  }

  constructor() {
    super();
    const offscreen = this.transferControlToOffscreen();
    this.worker.postMessage({
      type: DataType.transferCanvas,
      canvas: offscreen,
    } as TransferCanvas, [offscreen]);
    this.worker.postMessage({
      type: DataType.updateCanvas,
      unscaledWidth: this.unscaledWidth,
      unscaledHeight: this.unscaledHeight,
      scale: this.scale,
      padding: this.padding,
      color: this.color,
      dimColor: this.dimColor,
      backgroundColor: this.backgroundColor,
    } as UpdateCanvas);
    if(this.ownerDocument.hidden) this.handleVisiblityChange();
    this.ownerDocument.addEventListener('visibilitychange', this.handleVisiblityChange);
  }

  createRegion(options?: Partial<LedDisplayRegionOptions> | null) {
    options = options || {};
    options.worker = this.worker;
    if(options.originX == null)
      options.originX = 0;
    else if(options.originX < 0)
      options.originX += this.unscaledWidth;
    if(options.originY == null)
      options.originY = 0;
    else if(options.originY < 0)
      options.originY += this.unscaledHeight;
    if(options.width == null)
      options.width = this.unscaledWidth - options.originX;
    else if(options.width <= 0)
      options.width += this.unscaledWidth - options.originX;
    if(options.height == null)
      options.height = this.unscaledHeight - options.originY;
    else if(options.height <= 0)
      options.height += this.unscaledHeight - options.originY;
    const region = new LedDisplayRegion(options as LedDisplayRegionOptions);
    this.regions.push(region);
    return region;
  }

  clear() {
    this.worker.postMessage({
      type: DataType.clear,
    } as Clear);
  }

  @Bind
  private handleVisiblityChange() {
    this.worker.postMessage({
      type: DataType.focus,
      state: !this.ownerDocument.hidden,
    } as Focus);
  }
}
