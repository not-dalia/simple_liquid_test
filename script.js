
const WaterAnimation = {
  /**
   * Initialise the animation and start it.
   */
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


  /**
   * Generate a set of SVG lines to represent a millilitre scale.
   * The scale goes from 0 to 100, with 10 major ticks.
   * @returns {void}
   */
  generateSVGMillilitreScale () {
    const scale = document.querySelector('#scale');
    scale.innerHTML = '';
    const tickHeight = this.screenHeight / 100;
    const bigTickWidth = Math.min(this.screenWidth * 0.1, 25);
    const smallTickWidth = bigTickWidth * 0.65;
    const ticksCount = Math.floor(this.screenHeight / tickHeight);
    for (let i = 0; i < ticksCount; i++) {
      const isBigTick = i % 10 === 0;
      const tickWidth = isBigTick ? bigTickWidth : smallTickWidth;
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', 0);
      tick.setAttribute('y1', 0);
      tick.setAttribute('x2', tickWidth);
      tick.setAttribute('y2', 0);
      tick.setAttribute('transform', `translate(0 ${tickHeight * i})`);
      scale.appendChild(tick);
    }
  },


  /**
   * @typedef {Object} ScreenSize
   * @property {number} screenWidth - the width of the screen
   * @property {number} screenHeight - the height of the screen
   */

  /**
   * Get the screen size.
   * @returns {ScreenSize} - the screen size
   */
  getScreenSize () {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return { screenWidth, screenHeight };
  },

  /**
   * Calculate the path of the SVG wave. The wave is made of three peaks, extending beyond the screen for one extra wave
   * so that we can translate it to the left/right and have a continuous animation.
   * @returns {string} - the path of the SVG wave
   */
  calculateSVGWavePath () {
    const { screenWidth: width, screenHeight: height, currentHeight, peakHeight } = this;
    // generating a path that is made of three peaks, extending beyond the screen for one extra wave
    // so that we can translate it to the left/right and have a continuous animation
    const path = `M0 ${currentHeight} C${width / 2} ${currentHeight - peakHeight}, ${width / 2} ${currentHeight + peakHeight}, ${width} ${currentHeight}, ${width * 1.5} ${currentHeight - peakHeight}, ${width * 1.5} ${currentHeight + peakHeight}, ${width * 2} ${currentHeight} V${height * 1.5} H0 V${currentHeight * 1.5} Z`;
    return path;
  },


  /**
   * Set the path of the SVG wave and translate it to generate the wave/liquid animation.
   * @returns {void}
   */
  setSVGWavePath () {
    const wavePath = this.calculateSVGWavePath();
    let translateValue = -this.counter * 3 * this.screenWidth / 100 * 0.4;
    translateValue = translateValue % this.screenWidth;
    if (this.translateY == undefined) this.translateY = 0;

    // adjusting the y value so that the edge of the wave is always at the same point as currentHeight
    // does this actually improve the animation? who knows
    // also I could just do this when the height is reached, but I'm not sure that's any better
    if (this.isHeightReached) {
      const yValue = findYValueForXOnPath(-translateValue, wavePath);
      if (yValue) {
        // translateY should converge towards (-yValue + currentHeight)
        const targetTranslateY = -yValue + this.currentHeight;
        // we don't want to jump straight to that value, as that makes the animation look a bit jittery
        // so we slowly move towards it
        if (Math.abs(this.translateY - targetTranslateY) > 1) {
          this.translateY += (targetTranslateY - this.translateY) / 10;
        } else {
          this.translateY = targetTranslateY;
        }
      }
    }

    document.querySelector('#wave').setAttribute('d', wavePath);
    document.querySelector('#wave').setAttribute('transform', `translate(${translateValue} ${this.translateY})`)
    document.querySelector('#back-wave').setAttribute('d', wavePath);
    document.querySelector('#back-wave').setAttribute('transform', `scale (-1, 1) translate(${translateValue + this.screenWidth / 30} ${this.translateY})`)
  },


  /**
   * Set the initial animation parameters.
   * @returns {void}
   * @see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
   */
  setInitialAnimationParams () {
    const { screenWidth, screenHeight } = this.getScreenSize();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    // at the moment frame rate cannot go lower than 16.6666666667 for 60Hz screens
    // so I'm setting this to be the minimum frame duration to achieve a slightly
    // more consistent animation speed across different devices
    this.frameDuration = 16.6666666667;
    this.counter = 0;
    this.translateY = 0;
  },


  /**
   * Calculate the initial animation parameters based on the screen size.
   * @returns {void}
   */
  calculateAnimationParams () {
    // the maximum the liquid reaches is 75% of the screen height.
    // Y values start from top, hence the 0.25
    this.maxHeight = this.screenHeight * 0.25;

    // again, Y values start from top, so setting minHeight as 100% of the screen
    // means that the liquid will start from the bottom of the screen
    this.minHeight = this.screenHeight * 1;
    this.currentHeight = this.minHeight;
    this.heightDiff = this.minHeight - this.maxHeight;

    // all the numbers below are just magic numbers that I've tweaked until I got the animation I wanted
    // I'm sure there's a more scientific way to calculate them, but that's a task for future me
    this.heightIncreaseSpeed = this.screenHeight / 100 * 1.2;
    this.peakHeight = Math.min(this.screenWidth / 6, 200);
    // the deacceleration is calculated so that the speed is zero at maxHeight
    this.heightSpeedDeacceleration = -Math.pow(this.heightIncreaseSpeed, 2) / (2 * this.heightDiff);


    // if the minimum is 0, the waves will go completely still at the end. Keeping a minimum value
    // above zero means we can keep the waves moving a little bit all the time
    this.minPeakHeight = Math.max(this.screenWidth / 80, 20);
    this.peakAttenuationSpeed = this.screenWidth / 100 * 0.8;
  },


  /**
   * Calculate the new animation parameters based on the new screen size.
   * @returns {void}
   */
  calculateResizeParams () {
    // adjust everything based on the new screen size
    const { screenWidth, screenHeight } = this.getScreenSize();
    const heightPercentageChange = screenHeight / this.screenHeight;
    const widthPercentageChange = screenWidth / this.screenWidth;
    const adjustedHeightDiff = this.heightDiff * heightPercentageChange;
    const adjustedHeightIncreaseSpeed = this.heightIncreaseSpeed * heightPercentageChange;
    const adjustedHeightSpeedDeacceleration = this.heightSpeedDeacceleration * heightPercentageChange;
    const adjustedPeakHeight = Math.min(this.peakHeight * widthPercentageChange, 100);
    const adjuctedCurrentHeight = this.currentHeight * heightPercentageChange;
    const adjustedMinPeakHeight = Math.min(this.minPeakHeight * widthPercentageChange, 20);
    const adjustedPeakSpeed = this.peakAttenuationSpeed * widthPercentageChange;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.maxHeight = screenHeight * 0.25;
    this.minHeight = screenHeight * 1;
    this.heightDiff = adjustedHeightDiff;
    this.heightIncreaseSpeed = adjustedHeightIncreaseSpeed;
    this.heightSpeedDeacceleration = adjustedHeightSpeedDeacceleration;
    this.currentHeight = adjuctedCurrentHeight;
    this.peakHeight = adjustedPeakHeight;
    this.minPeakHeight = adjustedMinPeakHeight;
    this.peakAttenuationSpeed = adjustedPeakSpeed;
  },


  /**
   * The main animation function.
   * It calculates the new height of the liquid, the new path of the wave and sets the new values.
   * @param {number} timeStamp - the timestamp of the current frame
   * @returns {void}
   * @see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
   */
  animate (timeStamp) {
    // TODO: break this into more manageable functions
    if (this.start === undefined) this.start = timeStamp;

    if (this.previousTimeStamp == timeStamp || timeStamp - this.previousTimeStamp < this.frameDuration) {
      this.animationFrame = requestAnimationFrame((ts) => this.animate(ts));
      return;
    }
    this.previousTimeStamp = timeStamp;

    this.isHeightReached = false;
    if (this.currentHeight <= this.maxHeight) {
      this.currentHeight = this.maxHeight;
      this.isHeightReached = true;
    }
    this.calculateSVGWavePath();
    this.setSVGWavePath();

    // keep deaccelerating until height is reached
    if (this.heightIncreaseSpeed < 1 && !this.isHeightReached) {
      this.heightIncreaseSpeed = 1;
    } else if (this.heightIncreaseSpeed > 0 && !this.isHeightReached) {
      this.heightIncreaseSpeed += this.heightSpeedDeacceleration;
    }
    this.currentHeight -= this.heightIncreaseSpeed;

    if (this.isHeightReached) {
      // now that we've reached maxHeight, we slowly reduce the peak heights
      // until we reach the minimum peak height, just so things look a bit more natural
      if (this.peakHeight > this.minPeakHeight) {
        this.peakAttenuationAcceleration = this.peakAttenuationSpeed / 10;
        if (this.peakAttenuationSpeed < 0.2) {
          this.peakAttenuationSpeed = 0.2;
        } else if (this.peakAttenuationSpeed > 0.2) {
          this.peakAttenuationSpeed -= this.peakAttenuationAcceleration;
        }
        this.peakHeight -= this.peakAttenuationSpeed;
        if (this.peakHeight < this.minPeakHeight) this.peakHeight = this.minPeakHeight;
      }

    }
    this.counter++;
    this.animationFrame = requestAnimationFrame((ts) => this.animate(ts));
  },


  /**
   * Cancel the current animation frame and restart the animation.
   */
  restart () {
    cancelAnimationFrame(this.animationFrame)
    this.setInitialAnimationParams();
    this.calculateAnimationParams();
    this.setSVGWavePath();
    this.generateSVGMillilitreScale();
    this.animate();
  }
}


/*********************************************************************************/
/****************************** UTIL FUNCTIONS ***********************************/
/*********************************************************************************/

/**
  * Function to calculate y-value for a given x-coordinate on a cubic Bezier curve
  * based on cubic Bezier equation
  *
  * @param {number} t - the normalised x-coordinate on the curve, between 0 and 1
  * @param {Array} P0 - the start point of the curve
  * @param {Array} P1 - the first control point of the curve
  * @param {Array} P2 - the second control point of the curve
  * @param {Array} P3 - the end point of the curve
  * @returns {number} - the y-coordinate on the curve
  * @see https://blog.maximeheckel.com/posts/cubic-bezier-from-math-to-motion/
  * @see https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
 */
function cubicBezierY(t, P0, P1, P2, P3) {
  const term1 = Math.pow(1 - t, 3) * P0[1];
  const term2 = 3 * Math.pow(1 - t, 2) * t * P1[1];
  const term3 = 3 * (1 - t) * Math.pow(t, 2) * P2[1];
  const term4 = Math.pow(t, 3) * P3[1];

  return term1 + term2 + term3 + term4;
}

/**
 * Function to find the y-value for a given x-coordinate on the provided path.
 * We only need the start and the cubic Bezier curve segments, so we ignore all other commands.
 *
 * @param {number} x - the x-coordinate on the path
 * @param {string} pathData - the path data
 * @returns {number} - the y-coordinate on the path
 * @returns {null} - if the x-coordinate is not found on the path
 */
function findYValueForXOnPath(x, pathData) {
  const commands = pathData.split(/[ ,]+/);
  let currentX = 0, currentY = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i].toUpperCase().charAt(0);

    switch (command) {
      case 'M':
        currentX = parseFloat(commands[i].substring(1));
        currentY = parseFloat(commands[i + 1]);
        i ++;
        break;
      case 'C':
        const P0 = [currentX, currentY];
        const P1 = [parseFloat(commands[i].substring(1)), parseFloat(commands[i + 1])];
        const P2 = [parseFloat(commands[i + 2]), parseFloat(commands[i + 3])];
        const P3 = [parseFloat(commands[i + 4]), parseFloat(commands[i + 5])];

        if (x >= currentX && x <= P3[0]) {
          return cubicBezierY((x - currentX) / (P3[0] - currentX), P0, P1, P2, P3);
        }

        currentX = P3[0];
        currentY = P3[1];
        i += 5;
        break;
      default:
        break;
    }
  }

  return null;
}

/*********************************************************************************/
/*************************** END OF UTIL FUNCTIONS *******************************/
/*********************************************************************************/


WaterAnimation.init();
document.querySelector('#restart').addEventListener('click', () => {
  WaterAnimation.restart();
});
