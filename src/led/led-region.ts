import { DataType, UpdateRegion, Clear, Fill, PushData } from './led.common';

export interface LedDisplayRegionOptions {
  worker: Worker;
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export class LedDisplayRegion {
  static regionId = 0;
  regionId: number;
  private worker: Worker;
  private _width: number;
  private _height: number;
  private _originX: number;
  private _originY: number;
  private _offsetX = 0;
  private _offsetY = 0;
  data: boolean[][] = [[]];

  get width() { return this._width; }
  set width(value: number) {
    this._width = value;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      width: this.width,
    } as UpdateRegion);
  }

  get height() { return this._height; }
  set height(value: number) {
    this._height = value;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      height: this.height,
    } as UpdateRegion);
  }

  get originX() { return this._originX; }
  set originX(value: number) {
    this._originX = value;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      originX: this.originX,
    } as UpdateRegion);
  }

  get originY() { return this._originY; }
  set originY(value: number) {
    this._originY = value;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      originY: this.originY,
    } as UpdateRegion);
  }

  get offsetX() { return this._offsetX; }
  set offsetX(value: number) {
    this._offsetX = value;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      offsetX: this.offsetX,
    } as UpdateRegion);
  }

  get offsetY() { return this._offsetY; }
  set offsetY(value: number) {
    this._offsetY = value;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      offsetY: this.offsetY,
    } as UpdateRegion);
  }

  constructor(options: LedDisplayRegionOptions) {
    this.regionId = LedDisplayRegion.regionId++;
    this.worker = options.worker;
    this._width = options.width;
    this._height = options.height;
    this._originX = options.originX;
    this._originY = options.originY;
    this.worker.postMessage({
      type: DataType.updateRegion,
      regionId: this.regionId,
      width: this._width,
      height: this._height,
      originX: this._originX,
      originY: this._originY,
    } as UpdateRegion);
  }

  draw(data: boolean[][], offsetX = 0, offsetY = 0, additive?: boolean) {
    this.worker.postMessage({
      type: DataType.push,
      regionId: this.regionId,
      data, offsetX, offsetY, additive,
    } as PushData);
  }

  clear() {
    this.worker.postMessage({
      type: DataType.clear,
      regionId: this.regionId,
    } as Clear);
  }

  fill() {
    this.worker.postMessage({
      type: DataType.fill,
      regionId: this.regionId,
    } as Fill);
  }
}