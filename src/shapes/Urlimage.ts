// @ts-nocheck
import { TClassProperties } from '../typedefs';
import { classRegistry } from '../ClassRegistry';
import { createRectNotesDefaultControls } from '../controls/commonControls';
import type { Shadow } from '../Shadow';
import { Rect } from '../shapes/Rect';
import { loadImage } from '../util/misc/objectEnlive';
export const rectNotesDefaultValues: Partial<TClassProperties<UrlImage>> = {
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

export class UrlImage extends Image {

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

    static textLayoutProperties = [...UrlImage.textLayoutProperties, 'width'];

    static ownDefaults: Record<string, any> = rectNotesDefaultValues;

    static getDefaults() {
        return {
            ...super.getDefaults(),
            controls: createRectNotesDefaultControls(),
            ...UrlImage.ownDefaults,
        };
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
    //@ts-ignore
    constructor(element, options: any = {}) {
        this.filters = [];
        this.resizeFilters = [];
        this.callSuper('initialize', options);
        this.url = options.url;
        this.title = options.title;
        this.description = options.description;
        this.setControlsVisibility({
            tr: false,
            br: true,
            bl: false,
            ml: false,
            mr: false,
            mt: false,
            mb: false,
            mra: false,
            mla: false,
            mta: false,
            mba: false,
            tl: true,
            mtr: false,
        });

        this.shadow = new Shadow({
            color: 'rgba(217, 161, 177, 0.54)',
            offsetX: 1,
            offsetY: 2,
            blur: 4,
            //@ts-ignore
            spread: -5,
            id: 310,
        });

        this._initElement(element, options);
        this._initConfig(options);

        if (options.filters) {
            this.filters = options.filters;
            this.applyFilters();
        }

        this.set({
            clipPath: new Rect({
                left: 0,
                top: 0,
                rx: 8,
                ry: 8,
                width: 230,
                height: 248,
                fill: '#000000',
            }),
        });

        // double click
        InitializeEvent(this);
        this.initDoubleClickSimulation();
        this.width = 230;
        this.height = 248;
    }
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
    _render(ctx) {
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

    fromURL(url, callback, urlOptions?) {
        const img = new Image();
        const cvs = document.createElement('canvas');
        const ctx = cvs.getContext('2d');
        img.crossOrigin = '';
        img.onload = function () {
            // fix size version
            cvs.width = 230;
            cvs.height = 160; // 230 / img.width * img.height;
            ctx.drawImage(img, 0, 0, 230, 160);

            loadImage(
                cvs.toDataURL(),
                (_img) => {
                    if (callback) {
                        callback(new UrlImage(_img, urlOptions));
                    }
                },
                null,
                //@ts-ignore
                {
                    crossOrigin: 'anonymous',
                }, // urlOptions && urlOptions.crossOrigin
            );
        };
        img.src = `${url.split('?')[0]}`; // urlOptions.src;
    }
}

classRegistry.setClass(UrlImage);
