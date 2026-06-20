/**
 * RippleEffect implements a highly optimized 2D water displacement ripple simulator
 * running on a canvas. It uses a downscaled heightmap buffer (128x128) for 60fps performance
 * and sample-distorts a source background image (Misty Forest) behind glass panels.
 */
export class RippleEffect {
  constructor(canvasElement, backgroundImageSrc) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.imgSrc = backgroundImageSrc;
    this.img = new Image();
    
    // Wave buffers
    this.bufferSize = 128; // Downscaled buffer size for performance
    this.mapWidth = this.bufferSize;
    this.mapHeight = this.bufferSize;
    this.size = this.mapWidth * this.mapHeight;
    this.buffer1 = new Int16Array(this.size);
    this.buffer2 = new Int16Array(this.size);
    
    this.isLoaded = false;
    this.active = false;
    this.dampening = 0.985;
    this.maxDisplacement = 40; // Pixel distortion strength
  }

  init() {
    this.img.src = this.imgSrc;
    this.img.onload = () => {
      this.isLoaded = true;
      this.resizeCanvas();
      this.startLoop();
    };

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  updateImage(src) {
    this.imgSrc = src;
    this.isLoaded = false;
    this.img.src = src;
  }

  start() {
    this.active = true;
    if (this.isLoaded) this.startLoop();
  }

  stop() {
    this.active = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Spawns a ripple at specific client coordinates
   */
  triggerRipple(clientX, clientY, strength = 250) {
    if (!this.isLoaded || !this.active) return;
    
    // Map screen coordinates to downscaled buffer coordinates
    const x = Math.round((clientX / window.innerWidth) * this.mapWidth);
    const y = Math.round((clientY / window.innerHeight) * this.mapHeight);
    
    // Ensure coordinates sit within heightmap borders
    if (x > 1 && x < this.mapWidth - 1 && y > 1 && y < this.mapHeight - 1) {
      const idx = x + y * this.mapWidth;
      this.buffer1[idx] = strength;
      // also slightly ripple neighbors for smoothness
      this.buffer1[idx - 1] = strength >> 1;
      this.buffer1[idx + 1] = strength >> 1;
      this.buffer1[idx - this.mapWidth] = strength >> 1;
      this.buffer1[idx + this.mapWidth] = strength >> 1;
    }
  }

  startLoop() {
    if (!this.active) return;
    this.updateBuffer();
    this.render();
    requestAnimationFrame(() => this.startLoop());
  }

  /**
   * Core wave-equation relaxation pass
   */
  updateBuffer() {
    for (let i = this.mapWidth; i < this.size - this.mapWidth; i++) {
      // 4-neighbor average minus previous state
      this.buffer2[i] = ((
        this.buffer1[i - 1] +
        this.buffer1[i + 1] +
        this.buffer1[i - this.mapWidth] +
        this.buffer1[i + this.mapWidth]
      ) >> 1) - this.buffer2[i];

      // Apply wave energy dampening
      this.buffer2[i] = Math.round(this.buffer2[i] * this.dampening);
    }
    
    // Swap heightmap buffers
    const temp = this.buffer1;
    this.buffer1 = this.buffer2;
    this.buffer2 = temp;
  }

  /**
   * Projects heightmaps into displacement offsets and 샘플-draws the image
   */
  render() {
    if (!this.isLoaded) return;
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Draw background base image
    this.ctx.drawImage(this.img, 0, 0, w, h);
    
    // Sampling pixel data to apply wave distortions
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    
    // Copy pixels to make a reference source buffer
    const sourceBuffer = new Uint8ClampedArray(pixels);
    
    // Sampling loops
    for (let y = 1; y < h - 1; y++) {
      // map screen coordinate back to heightmap coordinate
      const mapY = Math.round((y / h) * (this.mapHeight - 1));
      const mapYIndex = mapY * this.mapWidth;
      
      for (let x = 1; x < w - 1; x++) {
        const mapX = Math.round((x / w) * (this.mapWidth - 1));
        const idx = mapX + mapYIndex;
        
        // Calculate slopes
        const xSlope = this.buffer1[idx - 1] - this.buffer1[idx + 1];
        const ySlope = this.buffer1[idx - this.mapWidth] - this.buffer1[idx + this.mapWidth];
        
        if (xSlope !== 0 || ySlope !== 0) {
          // Calculate refraction offsets
          const xOffset = Math.round((xSlope * this.maxDisplacement) >> 8);
          const yOffset = Math.round((ySlope * this.maxDisplacement) >> 8);
          
          // Clamp offsets to boundaries
          let targetX = x + xOffset;
          let targetY = y + yOffset;
          if (targetX < 0) targetX = 0;
          if (targetX >= w) targetX = w - 1;
          if (targetY < 0) targetY = 0;
          if (targetY >= h) targetY = h - 1;
          
          // Calculate buffer offsets
          const sourceIdx = (x + y * w) * 4;
          const targetIdx = (targetX + targetY * w) * 4;
          
          // Write displaced color channel data
          pixels[sourceIdx] = sourceBuffer[targetIdx];     // R
          pixels[sourceIdx + 1] = sourceBuffer[targetIdx + 1]; // G
          pixels[sourceIdx + 2] = sourceBuffer[targetIdx + 2]; // B
        }
      }
    }
    
    this.ctx.putImageData(imgData, 0, 0);
  }
}
