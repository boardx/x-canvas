// @ts-nocheck
import { TClassProperties, TSize } from '../typedefs';
import { classRegistry } from '../ClassRegistry';
import { createFileDefaultControls } from '../controls/commonControls';
import { Shadow } from '../Shadow';
import { Rect } from '../shapes/Rect';
import { getWindow } from '../env';
import { Image as FbricImage } from './Image';
import {
  loadImage,
  LoadImageOptions,
} from '../util/misc/objectEnlive';

import type {
  FabricObjectProps,
  SerializedObjectProps,
  TProps,
} from './Object/types';

export type WBFileSource =
  | string
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

interface UniqueWBFileProps {
  srcFromAttribute: boolean;
  minimumScaleTrigger: number;
  cropX: number;
  cropY: number;
  imageSmoothing: boolean;
  crossOrigin: string | null;
}

export const WBFileDefaultValues: Partial<TClassProperties<WBFile>> = {
  minWidth: 20,
  dynamicMinWidth: 2,
  lockScalingFlip: true,
  noScaleCache: false,
  _wordJoiners: /[ \t\r]/,
  splitByGrapheme: false,
  obj_type: 'WBFile',
  height: 200,
  maxHeight: 200,
};

export interface SerializedWBFileProps extends SerializedObjectProps {
  src: string;
  crossOrigin: string | null;
  filters: any[];
  resizeFilter?: any;
  cropX: number;
  cropY: number;
}
export interface WBFileProps extends FabricObjectProps, UniqueWBFileProps { }

export class WBFile<
  Props extends TProps<WBFileProps> = Partial<WBFileProps>,
> extends FbricImage {

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

  declare url: string;

  declare relationship: object[];

  public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'verticalAlign', 'lines', '_id', 'zIndex', 'relationship', 'url'];

  declare dynamicMinWidth: number;

  /**
   * Use this boolean property in order to split strings that have no white space concept.
   * this is a cheap way to help with chinese/japanese
   * @type Boolean
   * @since 2.6.0
   */
  declare splitByGrapheme: boolean;

  static ownDefaults: Record<string, any> = WBFileDefaultValues;

  static getDefaults() {
    return {
      ...super.getDefaults(),
      controls: createFileDefaultControls(),
      ...WBFile.ownDefaults,
    };
  }


  //@ts-ignore
  constructor(element: WBFileSource, options: Props) {
    super(element, options);
    this.filters = [];
    this.resizeFilters = [];
    this.name = options.name;
    this.isUploading = options.isUploading;

    this.shadow = new Shadow({
      color: 'rgba(217, 161, 177, 0.54)',
      offsetX: 1,
      offsetY: 2,
      blur: 4,
      //@ts-ignore
      spread: -5,
      id: 310,
    });
    const fileSuffixName = options.name.substring(options.name.lastIndexOf('.') + 1);
    this.clipPath = new Rect({
      left: 0,
      top: 0,
      rx: 8,
      ry: 8,
      width: fileSuffixName === 'pdf' ? 320 : 230,
      height: fileSuffixName === 'pdf' ? 453 : 248,
      fill: '#000000',
    }),

      // double click
      this.on('mousedblclick', () => {
        if (this.src || !this.isUploading) {
          //@ts-ignore
          if (Boardx.Util.isMobile()) {
            getWindow().parent.location.href = this.fileSrc ? this.fileSrc : this.src;
          } else if (this.isFileVideo(this.name)) {
            store.dispatch(handleSetVideoUrl(this.src));
          } else {
            getWindow().open(this.fileSrc ? this.fileSrc : this.src, '_blank').focus();
          }
        }
      });
    this.initDoubleClickSimulation();
    this.width = fileSuffixName === 'pdf' ? 320 : 230;
    this.height = fileSuffixName === 'pdf' ? 453 : 248;
  }
  setElement(element: WBFileSource, size: Partial<TSize> = {}) {
    this.removeTexture(this.cacheKey);
    this.removeTexture(`${this.cacheKey}_filtered`);
    this._element = element;
    this._originalElement = element;
    this._setWidthHeight(size);
    element.classList.add(WBFile.CSS_CANVAS);
    if (this.filters.length !== 0) {
      this.applyFilters();
    }
    // resizeFilters work on the already filtered copy.
    // we need to apply resizeFilters AFTER normal filters.
    // applyResizeFilters is run more often than normal filters
    // and is triggered by user interactions rather than dev code
    if (this.resizeFilter) {
      this.applyResizeFilters();
    }
  }

  toObject(propertiesToInclude: Array<any>): object {
    return super.toObject(
      [...this.extendPropeties, 'minWidth', 'splitByGrapheme'].concat(propertiesToInclude)
    );

  }
  getWidgetMenuList() {
    const menuList = [];
    if (this.locked) {
      menuList.push('objectLock');
    }
    else {
      menuList.push('more');
      menuList.push('objectLock');
      menuList.push('delete');
      menuList.push('fileName');
      menuList.push('borderLineIcon');
      menuList.push('fileDownload');
      const fileType = this.name.split('.').pop();
      if (fileType == 'mp3' || fileType === 'm4a' || fileType === 'wav') {
        menuList.push('audioToText');
      }
    }
    return menuList;
  }
  getWidgetMenuLength() {
    if (this.locked) return 50;
    return 60;
  }
  getContextMenuList() {
    let menuList;
    if (this.locked) {
      menuList = [
        'Bring forward',
        'Bring to front',
        'Send backward',
        'Send to back',
      ];
    } else {
      menuList = [
        'Bring forward',
        'Bring to front',
        'Send backward',
        'Send to back',
        'Duplicate',
        'Copy',
        'Paste',
        'Cut',
        'Delete',
      ];
    }
    if (this.locked) {
      menuList.push('Unlock');
    } else {
      menuList.push('Lock');
    }

    return menuList;
  }

  InitializeEvent = () => {
    const zoom = this.canvas?.getZoom() || 1;
    this.on('mousedblclick', (memo) => {
      const offsetX = memo.e.offsetX - (this.left - this.width / 2);
      const offsetY = memo.e.offsetY - (this.top - this.height / 2);

      if (
        offsetX < 20 ||
        offsetX > 480 ||
        offsetY < 20 ||
        offsetY > 480 ||
        (offsetY > 64 && offsetY < 446)
      ) {
        getWindow().open(this.url, '_blank').focus();
      } else {
        let text = this.title;
        const textarea = $('#urlTextarea');
        const cvsPosition = $('#canvasContainer').offset();
        let fontSize =
          20 * this.scaleX * zoom;
        const left = `${cvsPosition.left +
          (this.left - (this.width / 2 - 22) * this.scaleX) *
          zoom
          }px`;
        let top = `${cvsPosition.top +
          (this.top - (this.height / 2 - 22) * this.scaleY) *
          zoom
          }px`;
        const newWidth =
          (this.width - 44) *
          this.scaleX *
          zoom;
        const width = `${newWidth}px`;
        let height = `${40 * this.scaleY * zoom
          }px`;
        const paddingLeft = `${10 * this.scaleY * zoom
          }px`;
        let lineHeight = '40px';
        textarea.data('type', 'title');
        if (offsetY >= 446) {
          text = this.description;
          fontSize =
            15 * this.scaleX * zoom;
          top = `${cvsPosition.top +
            (this.top + (this.height / 2 - 52) * this.scaleY) *
            zoom
            }px`;
          height = `${30 * this.scaleY * zoom
            }px`;
          lineHeight = '30px';
          textarea.data('type', 'description');
        }
        textarea
          .data('widget', this)
          .css('left', left)
          .css('top', top)
          .css('padding-left', paddingLeft)
          .css('width', width)
          .css('height', height)
          .css('background-color', 'white')
          .css('font-size', `${fontSize}px`)
          .css('font-family', 'Arial')
          .css('line-height', lineHeight)
          .val(text)
          .show()
          .focus();
      }
    });
    this.on('removed', this.removedListener);
  };
  removedListener() {
    if (this.loading) {
      this.loading.remove();
      this.loading = null;
    }
  }
  initDoubleClickSimulation() {
    this.__lastClickTime = +new Date();
    this.on('touchstart', this.onMouseDown.bind(this));
    this.on('mousedown', this.onMouseDown.bind(this));
  }

  onMouseUp(options) {
    this.__newClickTime = +new Date();
    if (this.__newClickTime - this.__lastClickTime < 500) {
      this.fire('dblclick', options);
      this._stopEvent(options.e);
    }
    this.__lastClickTime = this.__newClickTime;
  }

  _stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  //@ts-ignore
  drawObject(ctx: CanvasRenderingContext2D) {
    let elementToDraw = null;
    // draw border
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.lineWidth = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.moveTo(-this.width / 2, -this.height / 2);
    ctx.stroke();

    if (
      this.isMoving === false &&
      this.resizeFilters.length &&
      this._needsResize()
    ) {
      this._lastScaleX = this.scaleX;
      this._lastScaleY = this.scaleY;
      elementToDraw = this.applyFilters(
        null,
        this.resizeFilters,
        this._filteredEl || this._originalElement,
        true,
      );
    } else {
      elementToDraw = this._element;
    }

    const imgWidth = this.name.substring(this.name.lastIndexOf('.') + 1) === 'pdf' ? 320 : 230;
    const imgHeight = this.name.substring(this.name.lastIndexOf('.') + 1) === 'pdf' ? 453 : 160;

    if (elementToDraw) {
      ctx.drawImage(elementToDraw, -this.width / 2, -this.height / 2, imgWidth, imgHeight);
    }

    if (this.name.substring(this.name.lastIndexOf('.') + 1) !== 'pdf') {
      this.renderTitle(ctx, this.name, this.getFileType(this.name));
    }
    this._renderStroke(ctx);
  }

  getFileType(name = '') {
    let fileType = '';
    switch (name.substring(name.lastIndexOf('.') + 1)) {
      case 'doc':
      case 'docx':
        fileType = 'Word Document';
        break;
      case 'xls':
      case 'xlsx':
        fileType = 'Excel Document';
        break;
      case 'ppt':
      case 'pptx':
        fileType = 'PPT Document';
        break;
      case 'pdf':
        fileType = 'PDF Document';
        break;
      case 'zip':
        fileType = 'ZIP File';
        break;
      case 'mp4':
        fileType = 'Video Document';
        break;
      case 'webm':
        fileType = 'Video Document';
        break;
      default:
        fileType = 'Other Document';
        break;
    }
    return fileType;
  }

  isFileVideo(name: string) {
    if (!name) return false;
    const FileType = this.name.split('.').pop();
    switch (name.substr(name.lastIndexOf('.') + 1)) {
      case FileType.MP4:
        return true;
      case FileType.WEBM:
        return true;
      default:
        return false;
    }
  }

  renderTitle(ctx, title) {
    const maxWidth = this.width;
    const x = -this.width / 2;
    const y = this.height / 2 - 60;

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';

    // white board behind the title
    ctx.fillRect(x, y - 29, maxWidth, 90);
    ctx.fillStyle = '#190FA1';

    // helper function to convert string
    const GB2312UnicodeConverter = {
      ToUnicode(str) {
        return escape(str).toLocaleLowerCase().replace(/%u/gi, '\\u');
      },
      ToGB2312(str) {
        return unescape(str.replace(/\\u/gi, '%u'));
      },
    };
    // Handle non-unicode or non-utf8 coding string
    const unicodeTitle = GB2312UnicodeConverter.ToUnicode(title);

    // handle the situation that the website's title is null
    if (title === null || unicodeTitle.indexOf('\\ufffd') !== -1 || !title) {
      const firstChar = this.url.indexOf('.');
      const lastChar = this.url.indexOf('.', firstChar + 1);
      this.title = this.url.substring(firstChar + 1, lastChar);
    }

    // title setting
    this.wrapText(ctx, title, x + 15, y - 5, maxWidth - 20, 23);

    // url setting
    const newurl = this.url ? `${this.url.split('/')[0]}/${this.url.split('/')[1]}/${this.url.split('/')[2]}` : '';
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(35, 41, 48, 0.65)';
    // gray square in front of website
    this.wrapText(ctx, newurl, x + 15, y + 45, maxWidth - 20, 25);
  }

  changeFileImgUrl(targetSrc) {
    this.setSrc(
      targetSrc,
      () => {
        this.width = 320;
        this.height = 453;
        this.dirty = true;
        if (canvas) {
          canvas.requestRenderAll();
        }
      },
      { crossOrigin: 'annonymous', ...this.toObject() }
    );
  }


  wrapText(context, text, x, y, maxWidth, lineHeight) {
    let words = '';
    if (text) words = text.split(' ');

    let line = '';
    let lineCount = 1;
    let tempLine = '';
    let _y = y;

    // handle non-English char
    if (escape(text).indexOf('%u') < 0) {
      // only the English char
      for (let n = 0; n < words.length; n++) {
        if (lineCount === 3) return;
        if (n !== 0) tempLine = `${line.slice(0, -3)}...`;
        const testLine = `${line + words[n]} `;
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          if (lineCount === 2) {
            line = tempLine;
          }
          context.fillText(line, x, _y);
          line = `${words[n]} `;
          _y += lineHeight;
          lineCount++;
        } else {
          line = testLine;
        }
      }
    } else {
      for (let n = 0; n < text.length; n++) {
        if (lineCount === 3) return;
        if (n !== 0) tempLine = `${line.slice(0, -2)}...`;
        const testLine = `${line + text[n]}`;
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          if (lineCount === 2) {
            line = tempLine;
          }
          context.fillText(line, x, _y);
          line = `${text[n]}`;
          _y += lineHeight;
          lineCount++;
        } else {
          line = testLine;
        }
      }
    }
    if (lineCount < 3) context.fillText(line, x, _y);
  }
  getFileIconURL(name) {
    let fileIconURL = '';
    switch (name.substring(name.lastIndexOf('.') + 1)) {
      case 'doc':
      case 'docx':
        fileIconURL = '/fileIcons/word.png';
        break;
      case 'xls':
      case 'xlsx':
        fileIconURL = '/fileIcons/excel.png';
        break;
      case 'ppt':
      case 'pptx':
        fileIconURL = '/fileIcons/ppt.png';
        break;
      case 'pdf':
        fileIconURL = '/fileIcons/pdf.svg';
        break;
      case 'zip':
        fileIconURL = '/fileIcons/zip.png';
        break;
      case 'mp4':
        fileIconURL = '/fileIcons/mp4.png';
        break;

      case 'webm':
        fileIconURL = '/fileIcons/mp4.png';
        break;
      default:
        fileIconURL = '/fileIcons/file.png';
        break;
    }
    return fileIconURL;
  }
  fromURL<T extends TProps<SerializedWBFileProps>>(fileOptions: T & LoadImageOptions = {}
  ): Promise<WBFile> {
    return new Promise(async (resolve, reject) => {
      const url = fileOptions.previewImage ? fileOptions.previewImage : this.getFileIconURL(fileOptions.name);
      try {
        const loadedImg = await loadImage(url, fileOptions && fileOptions.crossOrigin);
        resolve(new WBFile(loadedImg, fileOptions));
      } catch (error) {
        reject(error);
      }
    });
  }
}
classRegistry.setClass(WBFile);
