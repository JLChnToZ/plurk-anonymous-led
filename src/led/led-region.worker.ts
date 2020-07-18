export class LedDisplayRegionWorker {
  width = 0;
  height = 0;
  originX = 0;
  originY = 0;
  offsetX = 0;
  offsetY = 0;
  data: boolean[][] = [[]];

  constructor(public regionId: number) {}

  draw(data: boolean[][], offsetX = 0, offsetY = 0, additive?: boolean) {
    offsetX = Math.round(offsetX || 0);
    offsetY = Math.round(offsetY || 0);
    for(let y = 0, yl = data.length; y < yl; y++) {
      let sy = data[y];
      let yy = this.data[y + offsetY];
      if(!yy) this.data[y + offsetY] = yy = [];
      for(let x = 0, xl = sy.length; x < xl; x++)
        yy[x + offsetX] = !!(sy[x] || (additive && yy[x + offsetX]));
    }
  }

  clear() {
    for (let y = 0, l = this.data.length; y < l; y++)
      if(this.data[y])
        this.data[y].length = 0;
      else
        this.data[y] = [];
  }

  fill() {
    for(let i = 0; i < this.height; i++) {
      this.data[i] = this.data[i] || [];
      for(let j = 0; j < this.width; j++)
        this.data[i][j] = true;
    }
  }

  getData(x: number, y: number) {
    if(x < this.originX || x >= this.originX + this.width ||
      y < this.originY || y >= this.originY + this.height)
      return false;
    const yy = this.data[Math.round(y + this.offsetY - this.originY)];
    return yy && yy[Math.round(x + this.offsetX - this.originX)];
  }
}