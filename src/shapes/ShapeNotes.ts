// @ts-nocheck
import { getDocument } from '../env';
import { TClassProperties } from '../typedefs';
import { Textbox } from './Textbox';
import { classRegistry } from '../ClassRegistry';

// @TODO: Many things here are configuration related and shouldn't be on the class nor prototype
// regexes, list of properties that are not suppose to change by instances, magic consts.
// this will be a separated effort
export const shapeNotesDefaultValues: Partial<TClassProperties<ShapeNotes>> = {
  minWidth: 20,
  dynamicMinWidth: 2,
  lockScalingFlip: true,
  noScaleCache: false,
  _wordJoiners: /[ \t\r]/,
  splitByGrapheme: true,
  obj_type: 'WBShapeNotes',
  height: 138,
  maxHeight: 138,
  textAlign: 'center'
};

/**
 * Textbox class, based on IText, allows the user to resize the text rectangle
 * and wraps lines automatically. Textboxes have their Y scaling locked, the
 * user can only change width. Height is adjusted automatically based on the
 * wrapping of lines.
 */
export class ShapeNotes extends Textbox {
  /**selectable
   * Minimum width of textbox, in pixels.
   * @type Number
   * @default
   */
  declare minWidth: number;

  /* boardx cusotm function */
  declare _id: string;

  declare obj_type: string;

  declare locked: boolean;

  declare whiteboardId: string;

  declare userId: string;

  declare timestamp: Date;

  declare verticalAlign: string;

  declare zIndex: number;

  declare lines: object[];

  declare relationship: object[];

  declare icon: string;

  public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'verticalAlign', 'lines', '_id', 'zIndex', 'relationship', 'icon'];
  /**
   * Minimum calculated width of a textbox, in pixels.
   * fixed to 2 so that an empty textbox cannot go to 0
   * and is still selectable without text.
   * @type Number
   * @default
   */
  declare dynamicMinWidth: number;

  /**
   * Use this boolean property in order to split strings that have no white space concept.
   * this is a cheap way to help with chinese/japanese
   * @type Boolean
   * @since 2.6.0
   */
  declare splitByGrapheme: boolean;

  static textLayoutProperties = [...Textbox.textLayoutProperties, 'width'];

  static ownDefaults: Record<string, any> = shapeNotesDefaultValues;

  static getDefaults() {
    return {
      ...super.getDefaults(),
      ...ShapeNotes.ownDefaults,
    };
  }

  /**
   * Unlike superclass's version of this function, Textbox does not update
   * its width.
   * @private
   * @override
   */
  initDimensions() {
    if (!this.initialized) {
      return;
    }
    this.isEditing && this.initDelayedCursor();
    this._clearCache();
    // clear dynamicMinWidth as it will be different after we re-wrap line
    this.dynamicMinWidth = 0;
    // wrap lines
    this._styleMap = this._generateStyleMap(this._splitText());
    // if after wrapping, the width is smaller than dynamicMinWidth, change the width and re-wrap
    if (this.dynamicMinWidth > this.width) {
      this._set('width', this.dynamicMinWidth);
    }
    if (this.textAlign.indexOf('justify') !== -1) {
      // once text is measured we need to make space fatter to make justified text.
      this.enlargeSpaces();
    }
    // clear cache and re-calculate height
    const height = this.height;
    if (height > this.maxHeight && this.fontSize > 6) {
      this.set('fontSize', this.fontSize - 2);
      this._splitTextIntoLines(this.text);
      return;
    }

    return this.height;
  }
  /**
   * Generate an object that translates the style object so that it is
   * broken up by visual lines (new lines and automatic wrapping).
   * The original text styles object is broken up by actual lines (new lines only),
   * which is only sufficient for Text / IText
   * @private
   */
  _generateStyleMap(textInfo) {
    let realLineCount = 0,
      realLineCharCount = 0,
      charCount = 0;
    const map = {};

    for (let i = 0; i < textInfo.graphemeLines.length; i++) {
      if (textInfo.graphemeText[charCount] === '\n' && i > 0) {
        realLineCharCount = 0;
        charCount++;
        realLineCount++;
      } else if (
        !this.splitByGrapheme &&
        this._reSpaceAndTab.test(textInfo.graphemeText[charCount]) &&
        i > 0
      ) {
        // this case deals with space's that are removed from end of lines when wrapping
        realLineCharCount++;
        charCount++;
      }

      map[i] = { line: realLineCount, offset: realLineCharCount };

      charCount += textInfo.graphemeLines[i].length;
      realLineCharCount += textInfo.graphemeLines[i].length;
    }

    return map;
  }

  /**
   * Returns true if object has a style property or has it on a specified line
   * @param {Number} lineIndex
   * @return {Boolean}
   */
  styleHas(property, lineIndex: number): boolean {
    if (this._styleMap && !this.isWrapping) {
      const map = this._styleMap[lineIndex];
      if (map) {
        lineIndex = map.line;
      }
    }
    return super.styleHas(property, lineIndex);
  }

  /**
   * Returns true if object has no styling or no styling in a line
   * @param {Number} lineIndex , lineIndex is on wrapped lines.
   * @return {Boolean}
   */
  isEmptyStyles(lineIndex: number): boolean {
    if (!this.styles) {
      return true;
    }
    let offset = 0,
      nextLineIndex = lineIndex + 1,
      nextOffset,
      shouldLimit = false;
    const map = this._styleMap[lineIndex],
      mapNextLine = this._styleMap[lineIndex + 1];
    if (map) {
      lineIndex = map.line;
      offset = map.offset;
    }
    if (mapNextLine) {
      nextLineIndex = mapNextLine.line;
      shouldLimit = nextLineIndex === lineIndex;
      nextOffset = mapNextLine.offset;
    }
    const obj =
      typeof lineIndex === 'undefined'
        ? this.styles
        : { line: this.styles[lineIndex] };
    for (const p1 in obj) {
      for (const p2 in obj[p1]) {
        if (p2 >= offset && (!shouldLimit || p2 < nextOffset)) {
          // eslint-disable-next-line no-unused-vars
          for (const p3 in obj[p1][p2]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * @param {Number} lineIndex
   * @param {Number} charIndex
   * @private
   */
  _getStyleDeclaration(lineIndex: number, charIndex: number) {
    if (this._styleMap && !this.isWrapping) {
      const map = this._styleMap[lineIndex];
      if (!map) {
        return null;
      }
      lineIndex = map.line;
      charIndex = map.offset + charIndex;
    }
    return super._getStyleDeclaration(lineIndex, charIndex);
  }

  /**
   * @param {Number} lineIndex
   * @param {Number} charIndex
   * @param {Object} style
   * @private
   */
  _setStyleDeclaration(lineIndex: number, charIndex: number, style: object) {
    const map = this._styleMap[lineIndex];
    lineIndex = map.line;
    charIndex = map.offset + charIndex;

    this.styles[lineIndex][charIndex] = style;
  }

  /**
   * @param {Number} lineIndex
   * @param {Number} charIndex
   * @private
   */
  _deleteStyleDeclaration(lineIndex: number, charIndex: number) {
    const map = this._styleMap[lineIndex];
    lineIndex = map.line;
    charIndex = map.offset + charIndex;
    delete this.styles[lineIndex][charIndex];
  }

  /**
   * probably broken need a fix
   * Returns the real style line that correspond to the wrapped lineIndex line
   * Used just to verify if the line does exist or not.
   * @param {Number} lineIndex
   * @returns {Boolean} if the line exists or not
   * @private
   */
  _getLineStyle(lineIndex: number): boolean {
    const map = this._styleMap[lineIndex];
    return !!this.styles[map.line];
  }

  /**
   * Set the line style to an empty object so that is initialized
   * @param {Number} lineIndex
   * @param {Object} style
   * @private
   */
  _setLineStyle(lineIndex: number) {
    const map = this._styleMap[lineIndex];
    this.styles[map.line] = {};
  }

  /**
   * Wraps text using the 'width' property of Textbox. First this function
   * splits text on newlines, so we preserve newlines entered by the user.
   * Then it wraps each line using the width of the Textbox by calling
   * _wrapLine().
   * @param {Array} lines The string array of text that is split into lines
   * @param {Number} desiredWidth width you want to wrap to
   * @returns {Array} Array of lines
   */
  _wrapText(lines: Array<any>, desiredWidth: number): Array<any> {
    const wrapped = [];
    this.isWrapping = true;
    for (let i = 0; i < lines.length; i++) {
      wrapped.push(...this._wrapLine(lines[i], i, desiredWidth));
    }
    this.isWrapping = false;
    return wrapped;
  }

  /**
   * Helper function to measure a string of text, given its lineIndex and charIndex offset
   * It gets called when charBounds are not available yet.
   * Override if necessary
   * Use with {@link Textbox#wordSplit}
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {String} text
   * @param {number} lineIndex
   * @param {number} charOffset
   * @returns {number}
   */
  _measureWord(word, lineIndex: number, charOffset = 0): number {
    let width = 0,
      prevGrapheme;
    const skipLeft = true;
    for (let i = 0, len = word.length; i < len; i++) {
      const box = this._getGraphemeBox(
        word[i],
        lineIndex,
        i + charOffset,
        prevGrapheme,
        skipLeft
      );
      width += box.kernedWidth;
      prevGrapheme = word[i];
    }
    return width;
  }

  /**
   * Override this method to customize word splitting
   * Use with {@link Textbox#_measureWord}
   * @param {string} value
   * @returns {string[]} array of words
   */
  wordSplit(value: string): string[] {
    return value.split(this._wordJoiners);
  }

  /**
   * Wraps a line of text using the width of the Textbox and a context.
   * @param {Array} line The grapheme array that represent the line
   * @param {Number} lineIndex
   * @param {Number} desiredWidth width you want to wrap the line to
   * @param {Number} reservedSpace space to remove from wrapping for custom functionalities
   * @returns {Array} Array of line(s) into which the given text is wrapped
   * to.
   */
  _wrapLine(
    _line,
    lineIndex: number,
    desiredWidth: number,
    reservedSpace = 0
  ): Array<any> {
    const additionalSpace = this._getWidthOfCharSpacing(),
      splitByGrapheme = this.splitByGrapheme,
      graphemeLines = [],
      words = splitByGrapheme
        ? this.graphemeSplit(_line)
        : this.wordSplit(_line),
      infix = splitByGrapheme ? '' : ' ';

    let lineWidth = 0,
      line = [],
      // spaces in different languages?
      offset = 0,
      infixWidth = 0,
      largestWordWidth = 0,
      lineJustStarted = true;
    // fix a difference between split and graphemeSplit
    if (words.length === 0) {
      words.push([]);
    }
    desiredWidth -= reservedSpace;
    // measure words
    const data = words.map((word) => {
      // if using splitByGrapheme words are already in graphemes.
      word = splitByGrapheme ? word : this.graphemeSplit(word);
      const width = this._measureWord(word, lineIndex, offset);
      largestWordWidth = Math.max(width, largestWordWidth);
      offset += word.length + 1;
      return { word: word, width: width };
    });

    const maxWidth = Math.max(
      desiredWidth,
      largestWordWidth,
      this.dynamicMinWidth
    );
    // layout words
    offset = 0;
    let i;
    for (i = 0; i < words.length; i++) {
      const word = data[i].word;
      const wordWidth = data[i].width;
      offset += word.length;

      lineWidth += infixWidth + wordWidth - additionalSpace;
      if (lineWidth > maxWidth && !lineJustStarted) {
        graphemeLines.push(line);
        line = [];
        lineWidth = wordWidth;
        lineJustStarted = true;
      } else {
        lineWidth += additionalSpace;
      }

      if (!lineJustStarted && !splitByGrapheme) {
        line.push(infix);
      }
      line = line.concat(word);

      infixWidth = splitByGrapheme
        ? 0
        : this._measureWord([infix], lineIndex, offset);
      offset++;
      lineJustStarted = false;
    }

    i && graphemeLines.push(line);

    if (largestWordWidth + reservedSpace > this.dynamicMinWidth) {
      this.dynamicMinWidth = largestWordWidth - additionalSpace + reservedSpace;
    }
    return graphemeLines;
  }

  /**
   * Detect if the text line is ended with an hard break
   * text and itext do not have wrapping, return false
   * @param {Number} lineIndex text to split
   * @return {Boolean}
   */
  isEndOfWrapping(lineIndex: number): boolean {
    if (!this._styleMap[lineIndex + 1]) {
      // is last line, return true;
      return true;
    }
    if (this._styleMap[lineIndex + 1].line !== this._styleMap[lineIndex].line) {
      // this is last line before a line break, return true;
      return true;
    }
    return false;
  }

  /**
   * Detect if a line has a linebreak and so we need to account for it when moving
   * and counting style.
   * @return Number
   */
  missingNewlineOffset(lineIndex) {
    if (this.splitByGrapheme) {
      return this.isEndOfWrapping(lineIndex) ? 1 : 0;
    }
    return 1;
  }

  /**
   * Gets lines of text to render in the Textbox. This function calculates
   * text wrapping on the fly every time it is called.
   * @param {String} text text to split
   * @returns {Array} Array of lines in the Textbox.
   * @override
   */
  _splitTextIntoLines(text: string) {
    const newText = super._splitTextIntoLines(text),
      graphemeLines = this._wrapText(newText.lines, this.width),
      lines = new Array(graphemeLines.length);
    for (let i = 0; i < graphemeLines.length; i++) {
      lines[i] = graphemeLines[i].join('');
    }
    newText.lines = lines;
    newText.graphemeLines = graphemeLines;
    return newText;
  }

  getMinWidth() {
    return Math.max(this.minWidth, this.dynamicMinWidth);
  }

  _removeExtraneousStyles() {
    const linesToKeep = {};
    for (const prop in this._styleMap) {
      if (this._textLines[prop]) {
        linesToKeep[this._styleMap[prop].line] = 1;
      }
    }
    for (const prop in this.styles) {
      if (!linesToKeep[prop]) {
        delete this.styles[prop];
      }
    }
  }

  getObject() {
    const object = {};
    const keys = [
      '_id',
      'angle',
      'backgroundColor',
      'fill',
      'width',
      'height',
      'left',
      'locked',
      'lockScalingX',
      'lockScalingY',
      'lockMovementX',
      'lockMovementY',
      'lockScalingFlip',
      'obj_type',
      'originX',
      'originY',
      'scaleX',
      'scaleY',
      'selectable',
      'top',
      'userNo',
      'userId',
      'whiteboardId',
      'zIndex',
      'version',
      'isPanel',
      'panelObj',
      'relationship',
      'flipX',
      'flipY',
      'stroke',
      'strokeWidth',
      'lines',
      'src',
      'name',
      'progressBar',
      'isUploading',
      'initedProgressBar',
      'hoverCursor',
      'lockUniScaling',
      'cornerStyle',
      'lightbox',
      'cropSelectionRect',
    ];
    keys.forEach((key) => {
      object[key] = this[key];
    });
    return object;
  }

  /**
   * Returns object representation of an instance
   * @method toObject
   * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
   * @return {Object} object representation of an instance
   */
  toObject(propertiesToInclude: Array<any>): object {
    return super.toObject(
      [...this.extendPropeties, 'minWidth', 'splitByGrapheme'].concat(propertiesToInclude)
    );

  }
  /**boardx custom function */

  getWidgetMenuList() {
    if (this.isDraw) {
      return [
        'textNote',
        'borderLineIcon',
        'backgroundColor',
        'resetDraw',
        'switchNoteType',
        'drawOption',
        'lineWidth',
        'noteDrawColor', // strokeColor
        'emojiMenu',
        'more',
        'objectLock',
        'aiassist'
      ];
    }
    if (this.locked) {
      return ['objectLock'];
    }
    return [
      'drawNote',
      'more',
      'borderLineIcon',
      'switchNoteType',
      'fontSize',
      'textAlign',
      'backgroundColor',
      'emojiMenu',
      'fontWeight',
      'textBullet',
      'objectLock',
      'delete',
      'aiassist'
    ];
  }
  getWidgetMenuTouchList() {
    if (this.isDraw) {
      return ['emojiMenu', 'objectLock'];
    }
    if (this.locked) {
      return ['objectLock'];
    }
    return [
      'objectDelete',
      'moreMenuStickyNote',
      'backgroundColor',
      'fontColor',
      'emojiMenu',
      'objectLock',
      'aiassist'
    ];
  }
  getWidgetMenuLength() {
    if (this.locked) return 50;
    if (this.isDraw) {
      return 308;
    }
    return 420;
  }
  /* caculate cusor positon in the middle of the textbox */
  getCenteredTop(rectHeight) {
    const textHeight = this.height;
    return (rectHeight - textHeight) / 2;
  }

  _renderBackground(ctx) {
    if (!this.backgroundColor) {
      return;
    }
    const dim = this._getNonTransformedDimensions();
    ctx.fillStyle = this.backgroundColor;

    ctx.shadowBlur = 20;
    // ctx.shadowOffsetX = 2 * this.scaleX * canvas.getZoom();
    // ctx.shadowOffsetY = 6 * this.scaleY * canvas.getZoom();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    // ctx.shadowColor = 'rgba(0,0,0,1)';

    //ctx.fillRect(-dim.x / 2, -dim.y / 2, dim.x, dim.y);

    // if there is background color no other shadows
    // should be casted
    this._removeShadow(ctx);
    /*
      0: rect
      1: diamond
      2: rounded rect
      3: circle
      4: hexagon
      5: triangle
      6: parallelogramIcon
      7: star
      8: cross
      9: leftside right triangle
      10: rightside right triangle
      11: topside semicirle circle
      12: top-left quarter circle
      13: Constallation Rect
      14: Constellation Round
    */

    const shapeArray = [
      'M-69,-69L69,-69 69,69 -69,69z',
      'm-69,0 l69,-69 69,69 -69,69 -69,-69z',
      'm51.14083,-70l-101.28163,0c-10.96794,0 -19.8592,8.76514 -19.8592,19.5775l0,99.84501c0,10.81235 8.89125,19.5775 19.8592,19.5775l101.28163,0c10.96792,0 19.8592,-8.76516 19.8592,-19.5775l0,-99.84501c0,-10.81237 -8.89127,-19.5775 -19.8592,-19.5775z',
      'M-69,0a69,69 0 1,0 138,0a69,69 0 1,0 -138,0',
      'm-60,-35.1325l60.3923,-34.8675l60.3923,34.8675l0,69.73493l-60.3923,34.86799l-60.3923,-34.86799l0,-69.73493z',
      'm-71,70.74999l70.5,-139.74999l70.5,139.74999l-140.99999,0z',
      'm-70.21501,70.82836l28,-140.00001l112,0l-28,140.00001l-112,0z',
      'm-69,-16.38404l52.71168,0l16.28832,-52.61596l16.28833,52.61596l52.71167,0l-42.64457,32.51808l16.28916,52.61596l-42.64459,-32.51897l-42.64458,32.51897l16.28916,-52.61596l-42.64458,-32.51808z',
      'm-70,-23.40091l46.59909,0l0,-46.59909l47.80182,0l0,46.59909l46.59909,0l0,47.80182l-46.59909,0l0,46.59909l-47.80182,0l0,-46.59909l-46.59909,0l0,-47.80182z',
      'm69,69l-138,0l0,-138l138,138z',
      'm-69,70l139,0l0,-139l-139,139z',
      'm70.87066,36.0449l-140.87066,-0.00205c5.11499,-39.91161 35.12907,-69.54285 70.43538,-69.54285c35.30263,0 65.31841,29.63308 70.43528,69.5449z',
      'm-69,68.5488c9.55735,-78.68015 68.34233,-137.52537 137.9372,-138.04693l0,90.66818l0,47.38267l-137.9372,-0.00392z',
      'm30.81958,0.12008l37.68039,34.8592l0,35.52068l-139.99994,0l0,-141.99993l139.99994,0l0,34.81153l-37.68601,36.28619l-0.27367,0.26402l0.2793,0.25831l-0.00001,0z',
      'm29.19742,0.94831c0.00348,0.00417 0.00696,0.00835 0.01948,0.00209c0.01113,0.01879 0.02435,0.03757 0.03896,0.05566l0,0l0.00139,0.0007l0.00765,0.00557l0.06123,0.04731l0.48914,0.37851l3.91657,3.02875l31.11617,24.06231c-10.70812,24.39489 -35.07657,41.43186 -63.42351,41.43186c-38.23501,0 -69.23061,-30.9958 -69.23061,-69.23053c0,-38.23494 30.9956,-69.23053 69.23061,-69.23053c28.07281,0 52.24365,16.70877 63.10832,40.72522c-17.77729,13.90775 -26.59983,20.96711 -30.9784,24.5504c-2.19729,1.79825 -3.27854,2.72365 -3.8122,3.20102c-0.26509,0.23754 -0.40077,0.36953 -0.47244,0.44593c-0.0334,0.03597 -0.06401,0.07132 -0.08767,0.1068c-0.00974,0.01524 -0.0334,0.05267 -0.04801,0.10465c-0.00765,0.02721 -0.01739,0.07466 -0.01113,0.13338c0.00348,0.03131 0.01113,0.0661 0.02714,0.10228c0.00417,0.01044 0.00905,0.02018 0.01461,0.02992c0.00417,0.00765 0.00905,0.016 0.01461,0.02366c0.00557,0.00835 0.01531,0.02087 0.01809,0.02505z'
    ];

    ctx.save();

    const svgPath = new Path2D(shapeArray[this.icon]);
    const m = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
    m.a = this.width / 138;
    m.b = 0;
    m.c = 0;
    m.d = this.height / 138;
    m.e = 0;
    m.f = 0;
    const path = new Path2D();
    path.addPath(svgPath, m);
    // ctx.lineWidth = this.lineWidth / (this.width / 138 + this.height / 138) / 2;
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.stroke;
    ctx.stroke(path);
    ctx.fillStyle = this.backgroundColor;
    ctx.fill(path);
    ctx.restore();
  }
  getTopOffset() {
    let tOffset = 0;
    switch (this.icon) {
      case 0:
      case 2:
        tOffset = 40;
        break;
      case 1:
      case 3:
      case 5:
        tOffset = this.height / 2;
        break;
      case 4:
        tOffset = this.height / 3;
        break;
      default:
    }
    return tOffset;
  }
  getLeftOffset() {
    let lOffset = 0;
    switch (this.icon) {
      case 0:
      case 2:
      case 4:
        lOffset = 40;
        break;
      case 1:
      case 3:
      case 5:
        lOffset = this.width / 2;
        break;
      default:
    }
    return lOffset;
  }
  _getTopOffset() {

    switch (this.verticalAlign) {
      case 'middle':
        return -this._getTotalLineHeight() / 2;
      case 'bottom':
        return this.height / 2 - this._getTotalLineHeight();
      default:
        return -this.height / 2;
    }
  }
  _getTotalLineHeight() {
    return this._textLines.reduce(
      (total, _line, index) => total + this.getHeightOfLine(index),
      0
    );
  }

  _renderText(ctx) {
    ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = 0;
    ctx.shadowColor = '';

    if (this.paintFirst === 'stroke') {
      this._renderTextStroke(ctx);
      this._renderTextFill(ctx);
    } else {
      this._renderTextFill(ctx);
      this._renderTextStroke(ctx);
    }
  }
  calcTextHeight() {
    let lineHeight;
    let height = 0;
    for (let i = 0, len = this._textLines.length; i < len; i++) {
      lineHeight = this.getHeightOfLine(i);
      height += i === len - 1 ? lineHeight / this.lineHeight : lineHeight;
    }

    const desiredHeight = this.height * (100 / 138);

    if (height > desiredHeight) {
      this.set('fontSize', this.fontSize - 2);
      //@ts-ignore
      this._splitTextIntoLines(this.text);
      height = this.maxHeight;
      return Math.max(height, this.height);
    }
    if (
      height < this.maxHeight &&
      this.maxHeight - height > 60 &&
      this.fontSize < 24
    ) {
      this.fontSize += 2;
      //@ts-ignore
      this._splitTextIntoLines(this.text.trim());

      return Math.max(height, this.height);
    }

    this.height = this.maxHeight;
  }
  _renderTextCommon(ctx, method) {
    ctx.save();
    let lineHeights = 0;
    const left = this._getLeftOffset();
    const top = this._getTopOffset();
    const offsets = this._applyPatternGradientTransform(
      ctx,
      method === 'fillText' ? this.fill : this.stroke
    );

    for (let i = 0, len = this._textLines.length; i < len; i++) {
      const heightOfLine = this.getHeightOfLine(i);
      const maxHeight = heightOfLine / this.lineHeight;
      const leftOffset = this._getLineLeftOffset(i);
      this._renderTextLine(
        method,
        ctx,
        this._textLines[i],
        left + leftOffset - offsets.offsetX,
        top + lineHeights + maxHeight - offsets.offsetY,
        i
      );
      lineHeights += heightOfLine;
    }
    ctx.restore();
  }
  renderEmoji(ctx) {
    if (this.emoji === undefined) {
      return;
    }

    let width = 0;
    const imageList = [
      this.canvas.emoji_thumb,
      this.canvas.emoji_love,
      this.canvas.emoji_smile,
      this.canvas.emoji_shock,
      this.canvas.emoji_question
    ];
    const imageListArray = [];
    const emojiList = [];
    for (let i = 0; i < 5; i++) {
      if (this.emoji[i] !== 0) {
        imageListArray.push(imageList[i]);
        emojiList.push(this.emoji[i]);
        width += 26.6;
      }
    }

    if (emojiList.length === 0) return;

    const x = this.width / 2 - width;
    const y = this.height / 2 - 18;
    ctx.font = '10px Inter ';
    ctx.lineJoin = 'round';
    ctx.save();
    ctx.translate(x - 10, y);
    this.drawRoundRectPath(ctx, width, 15, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fill();
    ctx.restore();

    //ctx.strokeRect(x - 10, y, width, 16);
    //ctx.fillRect(x - 10 + 10 / 2, y + 10 / 2, width - 10, 16 - 10);
    ctx.fillStyle = '#000';
    const isEmojiThumbExist = !(this.canvas.emoji_thumb === undefined);
    if (isEmojiThumbExist) {
      let modifier = 0;
      for (let i = 0; i < imageListArray.length; i++) {
        const imageX = this.width / 2 - 33.6 + modifier + 2;
        const imageY = this.height / 2 - 15;
        const imageW = 10;
        const imageH = 10;
        ctx.drawImage(imageListArray[i], imageX, imageY, imageW, imageH);
        ctx.fillText(
          emojiList[i].toString(),
          this.width / 2 - 20.6 + modifier + 1,
          y + 12
        );
        modifier -= 23.6;
      }
    }
  }

  setLockedShadow(locked) {
    if (locked) {
      this.shadow = new fabric.Shadow({
        blur: 2,
        offsetX: 0,
        offsetY: 0,
        color: 'rgba(0, 0, 0, 0.5)'
      });
    } else {
      this.shadow = new fabric.Shadow({
        blur: 8,
        offsetX: 0,
        offsetY: 4,
        color: 'rgba(0,0,0,0.04)'
      });
    }
  }

  _getSVGLeftTopOffsets() {
    return {
      textLeft: -this.width / 2,
      textTop: this._getTopOffset(),
      lineTop: this.getHeightOfLine(0)
    };
  }
}

classRegistry.setClass(ShapeNotes);
