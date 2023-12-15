const WaterAnimation = {
  init () {
    this.setInitialAnimationParams();
    this.calculateAnimationParams();
    this.setSVGWavePath();
    this.generateSVGMillilitreScale();
    this.animate();
    window.addEventListener('resize', () => {
      this.calculateResizeParams();
      this.generateSVGMillilitreScale();
      this.setSVGWavePath();
    });
  },
  generateSVGMillilitreScale () {
    const scale = document.querySelector('#scale');
    scale.innerHTML = '';
    const scaleHeight = this.screenHeight / 100;
    const scaleWidth = Math.min(this.screenWidth * 0.1, 25);
    const smallTickWidth = scaleWidth * 0.65;
    const scaleCount = Math.floor(this.screenHeight / scaleHeight);
    for (let i = 0; i < scaleCount; i++) {
      const isBigTick = i % 10 === 0;
      const tickWidth = isBigTick ? scaleWidth : smallTickWidth;
      const tickHeight = isBigTick ? scaleHeight * 2 : scaleHeight;
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', 0);
      tick.setAttribute('y1', 0);
      tick.setAttribute('x2', tickWidth);
      tick.setAttribute('y2', 0);
      tick.setAttribute('transform', `translate(0 ${scaleHeight * i})`);
      scale.appendChild(tick);
    }
    console.log(scaleCount);
  },
  getScreenSize () {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return { screenWidth, screenHeight };
  },
  getSVGWavePath () {
    const { screenWidth: width, screenHeight: height, currentHeight, peakHeight } = this;
    const path = `M0 ${currentHeight} C${width / 2} ${currentHeight - peakHeight}, ${width / 2} ${currentHeight + peakHeight}, ${width} ${currentHeight}, ${width * 1.5} ${currentHeight - peakHeight}, ${width * 1.5} ${currentHeight + peakHeight}, ${width * 2} ${currentHeight} V${height} H0 V${currentHeight} Z`;
    return path;
  },
  setSVGWavePath () {
    const wavePath = this.getSVGWavePath();
    let translateValue = -this.counter * this.screenWidth / 100 * 0.4;
    translateValue = translateValue % this.screenWidth;
    document.querySelector('#wave').setAttribute('d', wavePath);
    document.querySelector('#wave').setAttribute('transform', `translate(${translateValue} 0)`);
    document.querySelector('#back-wave').setAttribute('d', wavePath);
    document.querySelector('#back-wave').setAttribute('transform', `scale (-1, 1) translate(${translateValue + this.screenWidth / 30} 0)`)
  },
  setInitialAnimationParams () {
    const { screenWidth, screenHeight } = this.getScreenSize();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.frameDuration = 1000 / 60;
    this.counter = 0;
  },
  calculateAnimationParams () {
    this.maxHeight = this.screenHeight * 0.25;
    this.minHeight = this.screenHeight * 1;
    this.heightDiff = this.minHeight - this.maxHeight;
    this.heightIncreaseSpeed = this.screenHeight / 100 * 0.3;
    this.currentHeight = this.minHeight;
    this.peakHeight = Math.min(this.screenWidth / 8, 100);
    this.minPeakHeight = this.screenWidth / 80;
    this.waveWidth = this.screenHeight / 2;
    this.peakSpeed = this.screenWidth / 100 * 0.1;
  },
  calculateResizeParams () {
    const { screenWidth, screenHeight } = this.getScreenSize();
    const heightPercentageChange = screenHeight / this.screenHeight;
    const widthPercentageChange = screenWidth / this.screenWidth;
    const adjustedHeightDiff = this.heightDiff * heightPercentageChange;
    const adjustedHeightIncreaseSpeed = this.heightIncreaseSpeed * heightPercentageChange;
    const adjustedPeakHeight = this.peakHeight * widthPercentageChange;
    const adjustedWaveWidth = this.waveWidth * widthPercentageChange;
    const adjuctedCurrentHeight = this.currentHeight * heightPercentageChange;
    const adjustedMinPeakHeight = this.minPeakHeight * widthPercentageChange;
    const adjustedPeakSpeed = this.peakSpeed * widthPercentageChange;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.maxHeight = screenHeight * 0.25;
    this.minHeight = screenHeight * 1;
    this.heightDiff = adjustedHeightDiff;
    this.heightIncreaseSpeed = adjustedHeightIncreaseSpeed;
    this.currentHeight = adjuctedCurrentHeight;
    this.peakHeight = adjustedPeakHeight;
    this.waveWidth = adjustedWaveWidth;
    this.minPeakHeight = adjustedMinPeakHeight;
    this.peakSpeed = adjustedPeakSpeed;
  },
  animate () {
    let isHeightReached = false;
    if (this.currentHeight <= this.maxHeight) {
      this.currentHeight = this.maxHeight;
      isHeightReached = true;
    }
    this.getSVGWavePath();
    this.setSVGWavePath();

    this.currentHeight -= this.heightIncreaseSpeed;
    if (isHeightReached) {
      // adjust peak height
      if (this.peakHeight > this.minPeakHeight) {
        this.deacceleration = this.peakSpeed / 10;
        if (this.peakSpeed < 0.2) {
          this.peakSpeed = 0.2;
        } else if (this.peakSpeed > 0.2) {
          this.peakSpeed = this.peakSpeed - this.deacceleration;
        }
        this.peakHeight -= this.peakSpeed;
        if (this.peakHeight < this.minPeakHeight) this.peakHeight = this.minPeakHeight;
      }

    }
    this.counter++;
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },
  restart () {
    cancelAnimationFrame(this.animationFrame)
    this.setInitialAnimationParams();
    this.calculateAnimationParams();
    this.setSVGWavePath();
    this.generateSVGMillilitreScale();
    this.animate();
  }
}

WaterAnimation.init();
document.querySelector('#restart').addEventListener('click', () => {
  WaterAnimation.restart();
  console.log(WaterAnimation.heightIncreaseSpeed)
});
