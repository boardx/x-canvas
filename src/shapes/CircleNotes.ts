// @ts-nocheck
import { TClassProperties } from '../typedefs';
import { Textbox } from './Textbox';
import { classRegistry } from '../ClassRegistry';
import { createRectNotesDefaultControls } from '../controls/commonControls';
import { XY } from '../Point';
type CursorBoundaries = {
  left: number;
  top: number;
  leftOffset: number;
  topOffset: number;
};
// @TODO: Many things here are configuration related and shouldn't be on the class nor prototype
// regexes, list of properties that are not suppose to change by instances, magic consts.
// this will be a separated effort
export const circleNotesDefaultValues: Partial<TClassProperties<CircleNotes>> = {
  minWidth: 20,
  dynamicMinWidth: 2,
  lockScalingFlip: true,
  noScaleCache: false,
  _wordJoiners: /[ \t\r]/,
  splitByGrapheme: true,
  obj_type: 'WBCircleNotes',
  height: 138,
  maxHeight: 138,
  noteType: 'circle'
};

/**
 * Textbox class, based on IText, allows the user to resize the text rectangle
 * and wraps lines automatically. Textboxes have their Y scaling locked, the
 * user can only change width. Height is adjusted automatically based on the
 * wrapping of lines.
 */
export class CircleNotes extends Textbox {
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

  public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'verticalAlign', 'lines', '_id', 'zIndex', 'relationship'];
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

  static ownDefaults: Record<string, any> = circleNotesDefaultValues;

  static getDefaults() {
    return {
      ...super.getDefaults(),
      controls: createRectNotesDefaultControls(),
      ...CircleNotes.ownDefaults,
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
    const height = this.calcTextHeight();
    if (height > this.maxHeight && this.fontSize > 6) {
      this.set('fontSize', this.fontSize - 2);
      this._splitTextIntoLines(this.text);
      return;
    }


    return this.height;
  }

  calcTextHeight() {
    let lineHeight;
    let height = 0;
    for (let i = 0, len = this._textLines.length; i < len; i++) {
      lineHeight = this.getHeightOfLine(i);
      height += i === len - 1 ? lineHeight / this.lineHeight : lineHeight;
    }

    const desiredHeight = 82;

    if (height > desiredHeight) {
      this.set('fontSize', this.fontSize - 2);
      this._splitTextIntoLines(this.text);
      height = this.maxHeight;
      return Math.max(height, this.height);
    }

    this.height = this.maxHeight;
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
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); // start new path
    ctx.arc(0, 0, dim.x / 2, 0, 2 * Math.PI); // draw circle path
    ctx.closePath(); // close path
    ctx.strokeStyle = this.backgroundColor;
    ctx.fillStyle = this.backgroundColor;
    this._removeShadow(ctx);
    ctx.stroke();
    ctx.fill();
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

  _getTopOffset() {
    let topOffset = super._getTopOffset();
    console.log('super topoffset', topOffset)
    if (this.verticalAlign === 'middle') {
      topOffset += (this.height - this._getTotalLineHeight()) / 2;
    }
    console.log('origin topoffset', topOffset)
    return topOffset;
  }
  _getTotalLineHeight() {
    return this._textLines.reduce(
      (total, _line, index) => total + this.getHeightOfLine(index),
      0
    );
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
  recalcCursorPostion(position, textLines, text) {
    if (!textLines || !text) return;
    let positionOffset = position > text.length ? text.length : position;
    let lineIndex = 0;
    let charIndex = 0;
    let cursorOffset = 0;
    let tmpInputTextArray = text;

    if (position === 0 || textLines.length === 0 || text.length === 0) {
      return { lineIndex, charIndex, cursorOffset };
    }

    if (positionOffset > 0 && textLines.length > 0 && text.length > 0) {
      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        lineIndex = i;
        charIndex = positionOffset;
        if (positionOffset < line.length) {
          // 光标在当前行首或行内
          return { lineIndex, charIndex, cursorOffset };
        }
        tmpInputTextArray = _.drop(tmpInputTextArray, line.length);
        positionOffset -= line.length;
        if (positionOffset === 0) {
          return { lineIndex, charIndex, cursorOffset };
        }
        if (
          tmpInputTextArray.length > 0 &&
          (tmpInputTextArray[0] === '\n' || tmpInputTextArray[0] === ' ')
        ) {
          positionOffset--;
          tmpInputTextArray = _.drop(tmpInputTextArray, 1);
        } else {
          cursorOffset--;
        }
      }
      console.log('charIndex', charIndex)
      return { lineIndex, charIndex, cursorOffset };
    }
  }
  _setSelectionStyles(ctx, char, left, top) {
    const topOffset = this._getTopOffset(); // 获取覆盖后的 top offset 值
    top += topOffset; // 从原方法中减去 topOffset 以确保 top 的正确值
    super._setSelectionStyles(ctx, char, left, top); // 调用父类方法
  }

  _getNewSelectionStartFromOffset(
    mouseOffset: XY,
    prevWidth: number,
    width: number,
    index: number,
    jlen: number
  ) {
    const distanceBtwLastCharAndCursor = mouseOffset.x - prevWidth;
    const distanceBtwNextCharAndCursor = width - mouseOffset.x;
    const offset =
      distanceBtwNextCharAndCursor > distanceBtwLastCharAndCursor ||
        distanceBtwNextCharAndCursor < 0
        ? 0
        : 1;

    // 获取 topOffset 变量以计算垂直偏移
    const topOffset = this._getTopOffset();
    const lineHeight = this._getTotalLineHeight() / this._textLines.length;

    // 计算当前鼠标点击的行
    const clickedLine = Math.floor((mouseOffset.y - topOffset) / lineHeight);

    // 如果点击的行超出文本边界，设置为文本的最后一个字符
    if (clickedLine >= this._textLines.length) {
      return this._text.length;
    } else if (clickedLine < 0) {
      return 0;
    }

    let newSelectionStart = index + offset;

    // 如果对象水平翻转，镜像光标位置从末尾
    if (this.flipX) {
      newSelectionStart = jlen - newSelectionStart;
    }

    return newSelectionStart;
  }
}

classRegistry.setClass(CircleNotes);
