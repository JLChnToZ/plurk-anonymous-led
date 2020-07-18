export const enum DataType {
  transferCanvas = 'transfer-canvas',
  push = 'push',
  updateCanvas = 'update-canvas',
  updateRegion = 'update-region',
  clear = 'clear',
  fill = 'fill',
}

export interface Data {
  type: DataType;
}

export interface TransferCanvas extends Data {
  type: DataType.transferCanvas;
  canvas: OffscreenCanvas;
}

export interface PushData extends Data {
  type: DataType.push;
  regionId: number;
  data: boolean[][];
  offsetX?: number;
  offsetY?: number;
  additive?: boolean;
}

export interface UpdateCanvas extends Data {
  type: DataType.updateCanvas;
  unscaledWidth?: number;
  unscaledHeight?: number;
  scale?: number;
  color?: string;
  dimColor?: string;
  backgroundColor?: string;
  padding?: number;
}

export interface UpdateRegion extends Data {
  type: DataType.updateRegion;
  regionId: number;
  width?: number;
  height?: number;
  originX?: number;
  originY?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface Clear extends Data {
  type: DataType.clear;
  regionId?: number;
}

export interface Fill extends Data {
  type: DataType.fill;
  regionId: number;
}

export type AllData = TransferCanvas | UpdateCanvas | UpdateRegion | PushData | Clear | Fill;
