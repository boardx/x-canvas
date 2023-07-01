// @ts-nocheck
import { TClassProperties, TSize } from '../typedefs';
import { classRegistry } from '../ClassRegistry';
import { Shadow } from '../Shadow';
import { Rect } from '../shapes/Rect';
import { getWindow } from '../env';
import { Image as FbricImage } from './Image';
import { getDocument } from '../env';
import { createFileDefaultControls } from '../controls/commonControls';
import type {
    FabricObjectProps,
    SerializedObjectProps,
    TProps,
} from './Object/types';
import {
    loadImage,
    LoadImageOptions,
} from '../util/misc/objectEnlive';

export type ImageSource =
    | string
    | HTMLImageElement
    | HTMLVideoElement
    | HTMLCanvasElement;

interface UniqueImageProps {
    srcFromAttribute: boolean;
    minimumScaleTrigger: number;
    cropX: number;
    cropY: number;
    imageSmoothing: boolean;
    crossOrigin: string | null;
}

export const UrlImageDefaultValues: Partial<TClassProperties<UrlImage>> = {
    minWidth: 20,
    dynamicMinWidth: 2,
    lockScalingFlip: true,
    noScaleCache: false,
    _wordJoiners: /[ \t\r]/,
    splitByGrapheme: true,
    obj_type: 'WBUrlImage',
    height: 200,
    maxHeight: 200,
};

export interface SerializedImageProps extends SerializedObjectProps {
    src: string;
    crossOrigin: string | null;
    filters: any[];
    resizeFilter?: any;
    cropX: number;
    cropY: number;
}
export interface UrlImageProps extends FabricObjectProps, UniqueImageProps { }

export class UrlImage<
    Props extends TProps<UrlImageProps> = Partial<UrlImageProps>,
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

    declare relationship: object[];

    public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'verticalAlign', 'lines', '_id', 'zIndex', 'relationship'];

    declare dynamicMinWidth: number;

    /**
     * Use this boolean property in order to split strings that have no white space concept.
     * this is a cheap way to help with chinese/japanese
     * @type Boolean
     * @since 2.6.0
     */
    declare splitByGrapheme: boolean;

    static ownDefaults: Record<string, any> = UrlImageDefaultValues;

    static getDefaults() {
        return {
            ...super.getDefaults(),
            controls: createFileDefaultControls(),
            ...UrlImage.ownDefaults,
        };
    }


    //@ts-ignore
    constructor(element: ImageSource, options: Props) {
        super(element, options);
        this.filters = [];
        this.resizeFilters = [];

        this.url = options.url;
        this.title = options.title;
        this.description = options.description;

        this.shadow = new Shadow({
            color: 'rgba(217, 161, 177, 0.54)',
            offsetX: 1,
            offsetY: 2,
            blur: 4,
            //@ts-ignore
            spread: -5,
            id: 310,
        });

        this.clipPath = new Rect({
            left: 0,
            top: 0,
            rx: 8,
            ry: 8,
            width: 230,
            height: 248,
            fill: '#000000',
        }),

            // double click
            this.InitializeEvent();
        this.initDoubleClickSimulation();
        this.width = 230;
        this.height = 248;
    }
    setElement(element: ImageSource, size: Partial<TSize> = {}) {
        this.removeTexture(this.cacheKey);
        this.removeTexture(`${this.cacheKey}_filtered`);
        this._element = element;
        this._originalElement = element;
        this._setWidthHeight(size);
        element.classList.add(UrlImage.CSS_CANVAS);
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
        if (this.locked) {
            return ['objectLock'];
        }
        return ['more', 'objectLock', 'delete'];
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
    onMouseDown(options) {
        this.__newClickTime = +new Date();
        if (this.__newClickTime - this.__lastClickTime < 500) {
            this.lockMovementX = true;
            this.lockMovementY = true;
            this.fire('dblclick', options);
            this._stopEvent(options.e);
        } else {
            this.lockMovementX = false;
            this.lockMovementY = false;
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

        if (elementToDraw) {
            ctx.drawImage(elementToDraw, -this.width / 2, -this.height / 2, 230, 160);
        }

        this.renderTitle(ctx, this.title);

        this._renderStroke(ctx);
    }
    renderDescription(ctx) {
        const maxWidth = this.width;

        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const x = -this.width / 2;
        const y = this.height / 2;

        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0)';
        this.splitByGrapheme = true;
        this.wrapText(ctx, this.description, x, y, maxWidth, 18);
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
        const newurl = `${this.url.split('/')[0]}/${this.url.split('/')[1]}/${this.url.split('/')[2]
            }`;
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(35, 41, 48, 0.65)';
        // gray square in front of website
        this.wrapText(ctx, newurl, x + 15, y + 45, maxWidth - 20, 25);
    }
    renderPublishDate(ctx) {
        const maxWidth = this.width;

        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const x = -this.width / 2 + 20;
        const y = this.height / 2 - 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

        ctx.fillRect(-this.width / 2, y - 20, maxWidth, 30);

        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.wrapText(
            ctx,
            `${this.publisher}:${new Date(this.publishedDate).toDateString()}`,
            x,
            y,
            maxWidth,
            18,
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

    fromURL<T extends TProps<SerializedImageProps>>(
        url: string,
        options: T & LoadImageOptions = {}
    ): Promise<UrlImage> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const cvs = getDocument().createElement('canvas');
            const ctx = cvs.getContext('2d');
            img.crossOrigin = '';

            img.onload = async function () {
                // fix size version
                cvs.width = 230;
                cvs.height = 160; // 230 / img.width * img.height;
                ctx.drawImage(img, 0, 0, 230, 160);

                const imgOptions = {
                    crossOrigin: 'anonymous',
                    ...options,
                };

                try {
                    const loadedImg = await loadImage(cvs.toDataURL(), imgOptions);
                    resolve(new UrlImage(loadedImg, options));
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = function (error) {
                reject(error);
            };

            img.src = url;
        });
    }

}

classRegistry.setClass(UrlImage);
