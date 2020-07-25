import { LedDisplayRegionWorker } from "./led-region.worker";
import { AllData, DataType, UpdateCanvas, UpdateRegion, PushData, Clear, Fill, Focus } from './led.common';
import { Bind } from '../utils';

let ledWorker: LedWorker | undefined;

self.addEventListener('message', ev => {
  const data: AllData = ev.data;
  switch(data.type) {
    case DataType.transferCanvas:
      if(ledWorker == null)
        ledWorker = new LedWorker(data.canvas);
      break;
    case DataType.updateCanvas:
      ledWorker?.init(data);
      break;
    case DataType.updateRegion:
      ledWorker?.updateRegion(data);
      break;
    case DataType.push:
      ledWorker?.push(data);
      break;
    case DataType.clear:
      ledWorker?.clear(data);
      break;
    case DataType.fill:
      ledWorker?.fill(data);
      break;
    case DataType.focus:
      ledWorker?.updateFocus(data);
      break;
    default:
      console.warn('Unknown type', data);
  }
});

class LedWorker {
  unscaledWidth = 88;
  unscaledHeight = 31;
  scale = 4;
  color = 'rgba(255, 128, 0, 0.75)';
  dimColor = this.color;
  backgroundColor = 'rgba(0, 0, 0, 0.25)';
  padding = 1;
  private context: OffscreenCanvasRenderingContext2D;
  private regions = new Map<number, LedDisplayRegionWorker>();
  private triggered = false;
  private isFocus = true;

  constructor(private canvas: OffscreenCanvas) {
    this.context = canvas.getContext('2d')!;
  }

  init(options: UpdateCanvas) {
    if(options.unscaledWidth != null)
      this.unscaledWidth = options.unscaledWidth;
    if(options.unscaledHeight != null)
      this.unscaledHeight = options.unscaledHeight;
    if(options.scale != null)
      this.scale = options.scale;
    if(options.color != null)
      this.color = options.color;
    if(options.dimColor != null)
      this.dimColor = options.dimColor;
    if(options.backgroundColor != null)
      this.backgroundColor = options.backgroundColor;
    if(options.padding != null)
      this.padding = options.padding;
    if(options.unscaledWidth != null || options.scale != null || !this.triggered)
      this.canvas.width = this.unscaledWidth * this.scale;
    if(options.unscaledHeight != null || options.scale != null || !this.triggered)
      this.canvas.height = this.unscaledHeight * this.scale;
    if(!this.triggered) {
      this.triggered = true;
      this.update();
    }
  }

  updateRegion(options: UpdateRegion) {
    let region = this.regions.get(options.regionId);
    if(region) {
      if(options.originX != null) {
        if(options.originX < 0)
          region.originX = options.originX + this.unscaledWidth;
        else
          region.originX = options.originX;
      }
      if(options.originY != null) {
        if(options.originY < 0)
          region.originY = options.originY + this.unscaledHeight;
        else
          region.originY = options.originY;
      }
      if(options.width != null) {
        if(options.width <= 0)
          region.width = options.width + this.unscaledWidth - region.originX;
        else
          region.width = options.width;
      }
      if(options.height != null) {
        if(options.height <= 0)
          region.height = options.height + this.unscaledHeight - region.originY;
        else
          region.height = options.height;
      }
      if(options.offsetX != null)
        region.offsetX = options.offsetX;
      if(options.offsetY != null)
        region.offsetY = options.offsetY;
    } else {
      region = new LedDisplayRegionWorker(options.regionId);
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
      if(options.offsetX == null)
        options.offsetX = 0;
      if(options.offsetY == null)
        options.offsetY = 0;
      region.originX = options.originX;
      region.originY = options.originY;
      region.width = options.width;
      region.height = options.height;
      region.offsetX = options.offsetX;
      region.offsetY = options.offsetY;
      this.regions.set(options.regionId, region);
    }
  }

  push({ regionId, offsetX, offsetY, data, additive }: PushData) {
    if(!this.regions.has(regionId))
      return console.warn(`${regionId} is not registered`);
    this.regions.get(regionId)?.draw(data, offsetX, offsetY, additive);
  }

  clear({ regionId }: Clear) {
    if(regionId != null)
      return this.regions.get(regionId)?.clear();
    for(const region of this.regions.values())
      region.clear();
  }

  fill({ regionId }: Fill) {
    if(!this.regions.has(regionId))
      return console.warn(`${regionId} is not registered`);
    this.regions.get(regionId)?.fill();
  }

  updateFocus({ state }: Focus) {
    if(this.isFocus === !!state) return;
    this.isFocus = !!state;
    if(state) this.update();
  }

  @Bind
  private update() {
    if(!this.isFocus) return;
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.color;
    const size = this.scale - this.padding;
    const offset = this.padding / 2;
    for(let y = 0; y < this.unscaledHeight; y++) {
      for(let x = 0; x < this.unscaledWidth; x++) {
        let fill = false;
        for(const region of this.regions.values())
          if(region.getData(x, y)) {
            fill = true;
            break;
          }
        this.context.fillStyle = fill ? this.color : this.dimColor;
        this.context.fillRect(x * this.scale + offset, y * this.scale + offset, size, size);
      }
    }
    if(this.isFocus) requestAnimationFrame(this.update);
  }
}
