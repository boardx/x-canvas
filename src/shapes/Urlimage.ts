// @ts-nocheck
import { getDocument, getEnv } from '../env';
import type { BaseFilter } from '../filters/BaseFilter';
import { getFilterBackend } from '../filters/FilterBackend';
import { SHARED_ATTRIBUTES } from '../parser/attributes';
import { parseAttributes } from '../parser/parseAttributes';
import { TClassProperties, TSize } from '../typedefs';
import { uid } from '../util/internals/uid';
import { createCanvasElement } from '../util/misc/dom';
import { findScaleToCover, findScaleToFit } from '../util/misc/findScaleTo';
import {
    enlivenObjectEnlivables,
    enlivenObjects,
    loadImage,
    LoadImageOptions,
} from '../util/misc/objectEnlive';
import { parsePreserveAspectRatioAttribute } from '../util/misc/svgParsing';
import { classRegistry } from '../ClassRegistry';
import { FabricObject, cacheProperties } from './Object/FabricObject';
import type {
    FabricObjectProps,
    SerializedObjectProps,
    TProps,
} from './Object/types';
import type { ObjectEvents } from '../EventTypeDefs';
import { WebGLFilterBackend } from '../filters/WebGLFilterBackend';
import { createFileDefaultControls } from '../controls/commonControls';
import { Image } from './Image';
// @todo Would be nice to have filtering code not imported directly.

export type FileSource =
    | HTMLImageElement
    | HTMLVideoElement
    | HTMLCanvasElement;

interface UniqueFileProps {
    srcFromAttribute: boolean;
    minimumScaleTrigger: number;
    cropX: number;
    cropY: number;
    imageSmoothing: boolean;
    crossOrigin: string | null;
    filters: BaseFilter[];
    resizeFilter?: BaseFilter;
}

export const imageDefaultValues: Partial<UniqueFileProps> &
    Partial<FabricObjectProps> = {
    strokeWidth: 0,
    srcFromAttribute: false,
    minimumScaleTrigger: 0.5,
    cropX: 0,
    cropY: 0,
    imageSmoothing: true,
    obj_type: 'WBUrlImage'
};

export interface SerializedFileProps extends SerializedObjectProps {
    src: string;
    crossOrigin: string | null;
    filters: any[];
    resizeFilter?: any;
    cropX: number;
    cropY: number;
}

export interface FileProps extends FabricObjectProps, UniqueFileProps { }

const FILE_PROPS = ['cropX', 'cropY'] as const;

/**
 * @tutorial {@link http://fabricjs.com/fabric-intro-part-1#images}
 */
export class UrlImage<
    Props extends TProps<FileProps> = Partial<FileProps>,
    SProps extends SerializedFileProps = SerializedFileProps,
    EventSpec extends ObjectEvents = ObjectEvents
>
    extends FabricObject<Props, SProps, EventSpec>
    implements FileProps {
    /**
     * When calling {@link Image.getSrc}, return value from element src with `element.getAttribute('src')`.
     * This allows for relative urls as image src.
     * @since 2.7.0
     * @type Boolean
     * @default false
     */
    declare srcFromAttribute: boolean;

    /**
     * private
     * contains last value of scaleX to detect
     * if the Image got resized after the last Render
     * @type Number
     */
    protected _lastScaleX = 1;

    /**
     * private
     * contains last value of scaleY to detect
     * if the Image got resized after the last Render
     * @type Number
     */
    protected _lastScaleY = 1;

    /**
     * private
     * contains last value of scaling applied by the apply filter chain
     * @type Number
     */
    protected _filterScalingX = 1;

    /**
     * private
     * contains last value of scaling applied by the apply filter chain
     * @type Number
     */
    protected _filterScalingY = 1;

    /**
     * minimum scale factor under which any resizeFilter is triggered to resize the image
     * 0 will disable the automatic resize. 1 will trigger automatically always.
     * number bigger than 1 are not implemented yet.
     * @type Number
     */
    declare minimumScaleTrigger: number;

    /**
     * key used to retrieve the texture representing this image
     * @since 2.0.0
     * @type String
     * @default
     */
    declare cacheKey: string;

    /**
     * Image crop in pixels from original image size.
     * @since 2.0.0
     * @type Number
     * @default
     */
    declare cropX: number;

    /**
     * Image crop in pixels from original image size.
     * @since 2.0.0
     * @type Number
     * @default
     */
    declare cropY: number;

    /**
     * Indicates whether this canvas will use image smoothing when painting this image.
     * Also influence if the cacheCanvas for this image uses imageSmoothing
     * @since 4.0.0-beta.11
     * @type Boolean
     * @default
     */
    declare imageSmoothing: boolean;

    declare preserveAspectRatio: string;

    protected declare src: string;

    declare filters: BaseFilter[];
    declare resizeFilter: BaseFilter;

    /* boardx cusotm function */
    declare obj_type: string;

    declare locked: boolean;

    declare whiteboardId: string;

    declare userId: string;

    declare timestamp: Date;

    declare verticalAlign: string;

    declare zIndex: number;

    declare lines: object[];

    declare relationship: object[];

    public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'verticalAlign', 'line', 'relationship'];

    protected declare _element: FileSource;
    protected declare _originalElement: FileSource;
    protected declare _filteredEl: FileSource;

    static cacheProperties = [...cacheProperties, ...FILE_PROPS];

    static ownDefaults: Record<string, any> = imageDefaultValues;

    static getDefaults() {
        return {
            ...super.getDefaults(),
            controls: createFileDefaultControls(),
            ...Image.ownDefaults,
        };
    }
    /**
     * Constructor
     * Image can be initialized with any canvas drawable or a string.
     * The string should be a url and will be loaded as an image.
     * Canvas and Image element work out of the box, while videos require extra code to work.
     * Please check video element events for seeking.
     * @param {ImageSource | string} element Image element
     * @param {Object} [options] Options object
     */

    constructor(
        element: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
        options?: LoadImageOptions,
    ) {
        super(element, options);
    }
    /**
     * Returns image element which this instance if based on
     */
    getElement() {
        return this._element;
    }

    /**
     * Sets image element for this instance to a specified one.
     * If filters defined they are applied to new image.
     * You might need to call `canvas.renderAll` and `object.setCoords` after replacing, to render new image and update controls area.
     * @param {HTMLImageElement} element
     * @param {Partial<TSize>} [size] Options object
     */
    setElement(element: FileSource, size: Partial<TSize> = {}) {
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

    /**
     * Delete a single texture if in webgl mode
     */
    removeTexture(key: string) {
        const backend = getFilterBackend(false);
        if (backend instanceof WebGLFilterBackend) {
            backend.evictCachesForKey(key);
        }
    }

    /**
     * Delete textures, reference to elements and eventually JSDOM cleanup
     */
    dispose() {
        super.dispose();
        this.removeTexture(this.cacheKey);
        this.removeTexture(`${this.cacheKey}_filtered`);
        this._cacheContext = null;
        ['_originalElement', '_element', '_filteredEl', '_cacheCanvas'].forEach(
            (elementKey) => {
                getEnv().dispose(this[elementKey as keyof this] as Element);
                // @ts-expect-error disposing
                this[elementKey] = undefined;
            }
        );
    }

    /**
     * Get the crossOrigin value (of the corresponding image element)
     */
    getCrossOrigin(): string | null {
        return (
            this._originalElement &&
            ((this._originalElement as any).crossOrigin || null)
        );
    }

    /**
     * Returns original size of an image
     */
    getOriginalSize() {
        const element = this.getElement() as any;
        if (!element) {
            return {
                width: 0,
                height: 0,
            };
        }
        return {
            width: element.naturalWidth || element.width,
            height: element.naturalHeight || element.height,
        };
    }

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _stroke(ctx: CanvasRenderingContext2D) {
        if (!this.stroke || this.strokeWidth === 0) {
            return;
        }
        const w = this.width / 2,
            h = this.height / 2;
        ctx.beginPath();
        ctx.moveTo(-w, -h);
        ctx.lineTo(w, -h);
        ctx.lineTo(w, h);
        ctx.lineTo(-w, h);
        ctx.lineTo(-w, -h);
        ctx.closePath();
    }

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject<
        T extends Omit<Props & TClassProperties<this>, keyof SProps>,
        K extends keyof T = never
    >(propertiesToInclude: K[] = []): Pick<T, K> & SProps {
        const filters: Record<string, any>[] = [];
        this.filters.forEach((filterObj) => {
            filterObj && filters.push(filterObj.toObject());
        });
        return {
            ...super.toObject([...FILE_PROPS, ...this.extendPropeties, ...propertiesToInclude]),
            src: this.getSrc(),
            crossOrigin: this.getCrossOrigin(),
            filters,
            ...(this.resizeFilter
                ? { resizeFilter: this.resizeFilter.toObject() }
                : {}),
        };
    }

    /**
     * Returns true if an image has crop applied, inspecting values of cropX,cropY,width,height.
     * @return {Boolean}
     */
    hasCrop() {
        return (
            !!this.cropX ||
            !!this.cropY ||
            this.width < this._element.width ||
            this.height < this._element.height
        );
    }

    /**
     * Returns svg representation of an instance
     * @return {string[]} an array of strings with the specific svg representation
     * of the instance
     */
    _toSVG() {
        const imageMarkup = [],
            element = this._element,
            x = -this.width / 2,
            y = -this.height / 2;
        let svgString = [],
            strokeSvg,
            clipPath = '',
            imageRendering = '';
        if (!element) {
            return [];
        }
        if (this.hasCrop()) {
            const clipPathId = uid();
            svgString.push(
                '<clipPath id="imageCrop_' + clipPathId + '">\n',
                '\t<rect x="' +
                x +
                '" y="' +
                y +
                '" width="' +
                this.width +
                '" height="' +
                this.height +
                '" />\n',
                '</clipPath>\n'
            );
            clipPath = ' clip-path="url(#imageCrop_' + clipPathId + ')" ';
        }
        if (!this.imageSmoothing) {
            imageRendering = '" image-rendering="optimizeSpeed';
        }
        imageMarkup.push(
            '\t<image ',
            'COMMON_PARTS',
            'xlink:href="',
            this.getSvgSrc(true),
            '" x="',
            x - this.cropX,
            '" y="',
            y - this.cropY,
            // we're essentially moving origin of transformation from top/left corner to the center of the shape
            // by wrapping it in container <g> element with actual transformation, then offsetting object to the top/left
            // so that object's center aligns with container's left/top
            '" width="',
            element.width || element.naturalWidth,
            '" height="',
            element.height || element.naturalHeight,
            imageRendering,
            '"',
            clipPath,
            '></image>\n'
        );

        if (this.stroke || this.strokeDashArray) {
            const origFill = this.fill;
            this.fill = null;
            strokeSvg = [
                '\t<rect ',
                'x="',
                x,
                '" y="',
                y,
                '" width="',
                this.width,
                '" height="',
                this.height,
                '" style="',
                this.getSvgStyles(),
                '"/>\n',
            ];
            this.fill = origFill;
        }
        if (this.paintFirst !== 'fill') {
            svgString = svgString.concat(strokeSvg, imageMarkup);
        } else {
            svgString = svgString.concat(imageMarkup, strokeSvg);
        }
        return svgString;
    }

    /**
     * Returns source of an image
     * @param {Boolean} filtered indicates if the src is needed for svg
     * @return {String} Source of an image
     */
    getSrc(filtered?: boolean): string {
        const element = filtered ? this._element : this._originalElement;
        if (element) {
            if (element.toDataURL) {
                return element.toDataURL();
            }

            if (this.srcFromAttribute) {
                return element.getAttribute('src');
            } else {
                return element.src;
            }
        } else {
            return this.src || '';
        }
    }

    /**
     * Alias for getSrc
     * @param filtered
     * @deprecated
     */
    getSvgSrc(filtered?: boolean) {
        return this.getSrc(filtered);
    }

    /**
     * Loads and sets source of an image\
     * **IMPORTANT**: It is recommended to abort loading tasks before calling this method to prevent race conditions and unnecessary networking
     * @param {String} src Source string (URL)
     * @param {LoadImageOptions} [options] Options object
     */
    setSrc(src: string, { crossOrigin, signal }: LoadImageOptions = {}) {
        return loadImage(src, { crossOrigin, signal }).then((img) => {
            typeof crossOrigin !== 'undefined' && this.set({ crossOrigin });
            this.setElement(img);
        });
    }

    /**
     * Returns string representation of an instance
     * @return {String} String representation of an instance
     */
    toString() {
        return `#<Image: { src: "${this.getSrc()}" }>`;
    }

    applyResizeFilters() {
        const filter = this.resizeFilter,
            minimumScale = this.minimumScaleTrigger,
            objectScale = this.getTotalObjectScaling(),
            scaleX = objectScale.x,
            scaleY = objectScale.y,
            elementToFilter = this._filteredEl || this._originalElement;
        if (this.group) {
            this.set('dirty', true);
        }
        if (!filter || (scaleX > minimumScale && scaleY > minimumScale)) {
            this._element = elementToFilter;
            this._filterScalingX = 1;
            this._filterScalingY = 1;
            this._lastScaleX = scaleX;
            this._lastScaleY = scaleY;
            return;
        }
        const canvasEl = createCanvasElement(),
            sourceWidth = elementToFilter.width,
            sourceHeight = elementToFilter.height;
        canvasEl.width = sourceWidth;
        canvasEl.height = sourceHeight;
        this._element = canvasEl;
        this._lastScaleX = filter.scaleX = scaleX;
        this._lastScaleY = filter.scaleY = scaleY;
        getFilterBackend().applyFilters(
            [filter],
            elementToFilter,
            sourceWidth,
            sourceHeight,
            this._element
        );
        this._filterScalingX = canvasEl.width / this._originalElement.width;
        this._filterScalingY = canvasEl.height / this._originalElement.height;
    }

    /**
     * Applies filters assigned to this image (from "filters" array) or from filter param
     * @method applyFilters
     * @param {Array} filters to be applied
     * @param {Boolean} forResizing specify if the filter operation is a resize operation
     */
    applyFilters(filters: BaseFilter[] = this.filters || []) {
        filters = filters.filter((filter) => filter && !filter.isNeutralState());
        this.set('dirty', true);

        // needs to clear out or WEBGL will not resize correctly
        this.removeTexture(`${this.cacheKey}_filtered`);

        if (filters.length === 0) {
            this._element = this._originalElement;
            this._filteredEl = null;
            this._filterScalingX = 1;
            this._filterScalingY = 1;
            return;
        }

        const imgElement = this._originalElement,
            sourceWidth = imgElement.naturalWidth || imgElement.width,
            sourceHeight = imgElement.naturalHeight || imgElement.height;

        if (this._element === this._originalElement) {
            // if the element is the same we need to create a new element
            const canvasEl = createCanvasElement();
            canvasEl.width = sourceWidth;
            canvasEl.height = sourceHeight;
            this._element = canvasEl;
            this._filteredEl = canvasEl;
        } else {
            // clear the existing element to get new filter data
            // also dereference the eventual resized _element
            this._element = this._filteredEl;
            this._filteredEl
                .getContext('2d')
                .clearRect(0, 0, sourceWidth, sourceHeight);
            // we also need to resize again at next renderAll, so remove saved _lastScaleX/Y
            this._lastScaleX = 1;
            this._lastScaleY = 1;
        }
        getFilterBackend().applyFilters(
            filters,
            this._originalElement,
            sourceWidth,
            sourceHeight,
            this._element
        );
        if (
            this._originalElement.width !== this._element.width ||
            this._originalElement.height !== this._element.height
        ) {
            this._filterScalingX = this._element.width / this._originalElement.width;
            this._filterScalingY =
                this._element.height / this._originalElement.height;
        }
    }

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render(ctx: CanvasRenderingContext2D) {
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

    /**
     * Paint the cached copy of the object on the target context.
     * it will set the imageSmoothing for the draw operation
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    drawCacheOnCanvas(ctx: CanvasRenderingContext2D) {
        ctx.imageSmoothingEnabled = this.imageSmoothing;
        super.drawCacheOnCanvas(ctx);
    }

    /**
     * Decide if the object should cache or not. Create its own cache level
     * needsItsOwnCache should be used when the object drawing method requires
     * a cache step. None of the fabric classes requires it.
     * Generally you do not cache objects in groups because the group outside is cached.
     * This is the special image version where we would like to avoid caching where possible.
     * Essentially images do not benefit from caching. They may require caching, and in that
     * case we do it. Also caching an image usually ends in a loss of details.
     * A full performance audit should be done.
     * @return {Boolean}
     */
    shouldCache() {
        return this.needsItsOwnCache();
    }

    _renderFill(ctx: CanvasRenderingContext2D) {
        const elementToDraw = this._element;
        if (!elementToDraw) {
            return;
        }
        const scaleX = this._filterScalingX,
            scaleY = this._filterScalingY,
            w = this.width,
            h = this.height,
            // crop values cannot be lesser than 0.
            cropX = Math.max(this.cropX, 0),
            cropY = Math.max(this.cropY, 0),
            elWidth = elementToDraw.naturalWidth || elementToDraw.width,
            elHeight = elementToDraw.naturalHeight || elementToDraw.height,
            sX = cropX * scaleX,
            sY = cropY * scaleY,
            // the width height cannot exceed element width/height, starting from the crop offset.
            sW = Math.min(w * scaleX, elWidth - sX),
            sH = Math.min(h * scaleY, elHeight - sY),
            x = -w / 2,
            y = -h / 2,
            maxDestW = Math.min(w, elWidth / scaleX - cropX),
            maxDestH = Math.min(h, elHeight / scaleY - cropY);

        elementToDraw &&
            ctx.drawImage(elementToDraw, sX, sY, sW, sH, x, y, maxDestW, maxDestH);
    }

    /**
     * needed to check if image needs resize
     * @private
     */
    _needsResize() {
        const scale = this.getTotalObjectScaling();
        return scale.x !== this._lastScaleX || scale.y !== this._lastScaleY;
    }

    /**
     * @private
     * @deprecated unused
     */
    _resetWidthHeight() {
        this.set(this.getOriginalSize());
    }

    /**
     * @private
     * Set the width and the height of the image object, using the element or the
     * options.
     */
    _setWidthHeight({ width, height }: Partial<TSize> = {}) {
        const size = this.getOriginalSize();
        this.width = width || size.width;
        this.height = height || size.height;
    }

    /**
     * Calculate offset for center and scale factor for the image in order to respect
     * the preserveAspectRatio attribute
     * @private
     */
    parsePreserveAspectRatioAttribute() {
        const pAR = parsePreserveAspectRatioAttribute(
            this.preserveAspectRatio || ''
        ),
            pWidth = this.width,
            pHeight = this.height,
            parsedAttributes = { width: pWidth, height: pHeight };
        let rWidth = this._element.width,
            rHeight = this._element.height,
            scaleX = 1,
            scaleY = 1,
            offsetLeft = 0,
            offsetTop = 0,
            cropX = 0,
            cropY = 0,
            offset;

        if (pAR && (pAR.alignX !== 'none' || pAR.alignY !== 'none')) {
            if (pAR.meetOrSlice === 'meet') {
                scaleX = scaleY = findScaleToFit(this._element, parsedAttributes);
                offset = (pWidth - rWidth * scaleX) / 2;
                if (pAR.alignX === 'Min') {
                    offsetLeft = -offset;
                }
                if (pAR.alignX === 'Max') {
                    offsetLeft = offset;
                }
                offset = (pHeight - rHeight * scaleY) / 2;
                if (pAR.alignY === 'Min') {
                    offsetTop = -offset;
                }
                if (pAR.alignY === 'Max') {
                    offsetTop = offset;
                }
            }
            if (pAR.meetOrSlice === 'slice') {
                scaleX = scaleY = findScaleToCover(this._element, parsedAttributes);
                offset = rWidth - pWidth / scaleX;
                if (pAR.alignX === 'Mid') {
                    cropX = offset / 2;
                }
                if (pAR.alignX === 'Max') {
                    cropX = offset;
                }
                offset = rHeight - pHeight / scaleY;
                if (pAR.alignY === 'Mid') {
                    cropY = offset / 2;
                }
                if (pAR.alignY === 'Max') {
                    cropY = offset;
                }
                rWidth = pWidth / scaleX;
                rHeight = pHeight / scaleY;
            }
        } else {
            scaleX = pWidth / rWidth;
            scaleY = pHeight / rHeight;
        }
        return {
            width: rWidth,
            height: rHeight,
            scaleX,
            scaleY,
            offsetLeft,
            offsetTop,
            cropX,
            cropY,
        };
    }

    /**
     * Default CSS class name for canvas
     * @static
     * @type String
     * @default
     */
    static CSS_CANVAS = 'canvas-img';

    /**
     * List of attribute names to account for when parsing SVG element (used by {@link Image.fromElement})
     * @static
     * @see {@link http://www.w3.org/TR/SVG/struct.html#ImageElement}
     */
    static ATTRIBUTE_NAMES = [
        ...SHARED_ATTRIBUTES,
        'x',
        'y',
        'width',
        'height',
        'preserveAspectRatio',
        'xlink:href',
        'crossOrigin',
        'image-rendering',
    ];

    /**
     * Creates an instance of Image from its object representation
     * @static
     * @param {Object} object Object to create an instance from
     * @param {object} [options] Options object
     * @param {AbortSignal} [options.signal] handle aborting, see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal
     * @returns {Promise<Image>}
     */
    static fromObject<T extends TProps<SerializedFileProps>>(
        { filters: f, resizeFilter: rf, src, crossOrigin, ...object }: T,
        options: { signal: AbortSignal }
    ) {
        return Promise.all([
            loadImage(src, { ...options, crossOrigin }),
            f && enlivenObjects(f, options),
            // TODO: redundant - handled by enlivenObjectEnlivables
            rf && enlivenObjects([rf], options),
            enlivenObjectEnlivables(object, options),
        ]).then(([el, filters = [], [resizeFilter] = [], hydratedProps = {}]) => {
            return new this(el, {
                ...object,
                src,
                crossOrigin,
                filters,
                resizeFilter,
                ...hydratedProps,
            });
        });
    }

    /**
     * Creates an instance of Image from an URL string
     * @static
     * @param {String} url URL to create an image from
     * @param {LoadImageOptions} [options] Options object
     * @returns {Promise<Image>}
     */
    fromURL(url, resolve, reject, urlOptions?) {
        const img = getDocument().createElement('img');
        const cvs = getDocument().createElement('canvas');
        console.log('cvs', cvs);
        console.log('img', img);
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
                    console.log('_img', _img);
                    if (resolve) {
                        resolve(new UrlImage(_img, urlOptions));
                    }
                },
                null,
                //@ts-ignore
                {
                    crossOrigin: 'anonymous',
                }, // urlOptions && urlOptions.crossOrigin
            );
        };
        img.onerror = function (error) {
            reject(error);
        };
        img.src = `${url.split('?')[0]}`; // urlOptions.src;
        console.log('img', img)
    }

    /**
     * Returns {@link Image} instance from an SVG element
     * @static
     * @param {SVGElement} element Element to parse
     * @param {Object} [options] Options object
     * @param {AbortSignal} [options.signal] handle aborting, see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal
     * @param {Function} callback Callback to execute when Image object is created
     */
    static fromElement(
        element: SVGElement,
        callback: (image: UrlImage) => any,
        options: { signal?: AbortSignal } = {}
    ) {
        const parsedAttributes = parseAttributes(element, this.ATTRIBUTE_NAMES);
        this.fromURL(parsedAttributes['xlink:href'], {
            ...options,
            ...parsedAttributes,
        }).then(callback);
    }
    /*boardx custom functions */
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
}

classRegistry.setClass(UrlImage);
classRegistry.setSVGClass(UrlImage);