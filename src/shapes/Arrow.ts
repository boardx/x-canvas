import { SHARED_ATTRIBUTES } from '../parser/attributes';
import { parseAttributes } from '../parser/parseAttributes';
import { TClassProperties } from '../typedefs';
import { classRegistry } from '../ClassRegistry';
import { FabricObject, cacheProperties } from './Object/FabricObject';
import { Point } from '../Point';
import type {
  FabricObjectProps,
  SerializedObjectProps,
  TProps,
} from './Object/types';
import type { ObjectEvents } from '../EventTypeDefs';
import { makeBoundingBoxFromPoints } from '../util';
import { createPathDefaultControls } from '../controls/commonControls';
import { transformPoint } from '../util/misc/matrix';
// @TODO this code is terrible and Line should be a special case of polyline.

const coordProps = ['x1', 'x2', 'y1', 'y2'] as const;

interface UniqueLineProps {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface SerializedLineProps
  extends SerializedObjectProps,
  UniqueLineProps {
}

export class Arrow<
  Props extends TProps<FabricObjectProps> = Partial<FabricObjectProps>,
  SProps extends SerializedLineProps = SerializedLineProps,
  EventSpec extends ObjectEvents = ObjectEvents
>
  extends FabricObject<Props, SProps, EventSpec>
  implements UniqueLineProps {
  /**
   * x value or first line edge
   * @type number
   * @default
   */
  declare x1: number;

  /**
   * y value or first line edge
   * @type number
   * @default
   */
  declare y1: number;

  /**
   * x value or second line edge
   * @type number
   * @default
   */
  declare x2: number;

  /**
   * y value or second line edge
   * @type number
   * @default
   */
  declare y2: number;

  /*boardx custom declare*/
  declare _id: string;

  declare obj_type: string;

  declare locked: boolean;

  declare whiteboardId: string;

  declare userId: string;

  declare userNo: string;

  declare timestamp: Date;

  declare zIndex: number;

  declare connectorShape: string;

  declare subType: string;

  declare perPixelTargetFind: boolean;

  declare connectorEnd: object;

  declare connectorStart: object;

  declare connectorType: string;

  declare tips: string;

  declare connectorStyle: string;

  public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'connectorShape', '_id', 'subType', 'perPixelTargetFind', 'userNo', 'connectorEnd', 'connectorStart', 'connectorType', 'tips', 'connectorStyle'];

  static cacheProperties = [...cacheProperties, ...coordProps];
  /**
   * Constructor
   * @param {Array} [points] Array of points
   * @param {Object} [options] Options object
   * @return {Line} thisArg
   */
  constructor([x1, y1, x2, y2] = [0, 0, 0, 0], options: Props = {} as Props) {
    super({ ...options, x1, y1, x2, y2 });
    this._setWidthHeight();
    const { left, top } = options;
    typeof left === 'number' && this.set('left', left);
    typeof top === 'number' && this.set('top', top);
  }


  static getDefaults() {
    return {
      ...super.getDefaults(),
      controls: createPathDefaultControls(),
    };
  }
  /**
   * @private
   * @param {Object} [options] Options
   */
  _setWidthHeight() {
    const { x1, y1, x2, y2 } = this;
    this.width = Math.abs(x2 - x1);
    this.height = Math.abs(y2 - y1);
    const { left, top, width, height } = makeBoundingBoxFromPoints([
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ]);
    const position = new Point(left + width / 2, top + height / 2);
    this.setPositionByOrigin(position, 'center', 'center');
  }

  /**
   * @private
   * @param {String} key
   * @param {*} value
   */
  _set(key: string, value: any) {
    super._set(key, value);
    if (coordProps.includes(key as keyof UniqueLineProps)) {
      // this doesn't make sense very much, since setting x1 when top or left
      // are already set, is just going to show a strange result since the
      // line will move way more than the developer expect.
      // in fabric5 it worked only when the line didn't have extra transformations,
      // in fabric6 too. With extra transform they behave bad in different ways.
      // This needs probably a good rework or a tutorial if you have to create a dynamic line
      this._setWidthHeight();
    }
    return this;
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} ctx Context to render on
   */

  // _render(ctx: CanvasRenderingContext2D) {
  //   ctx.beginPath();

  //   const p = this.calcLinePoints();
  //   ctx.moveTo(p.x1, p.y1);
  //   ctx.lineTo(p.x2, p.y2);

  //   ctx.lineWidth = this.strokeWidth;

  //   // TODO: test this
  //   // make sure setting "fill" changes color of a line
  //   // (by copying fillStyle to strokeStyle, since line is stroked, not filled)
  //   const origStrokeStyle = ctx.strokeStyle;
  //   if (isFiller(this.stroke)) {
  //     ctx.strokeStyle = this.stroke.toLive(ctx)!;
  //   } else {
  //     ctx.strokeStyle = this.stroke ?? ctx.fillStyle;
  //   }
  //   this.stroke && this._renderStroke(ctx);
  //   ctx.strokeStyle = origStrokeStyle;

  // }

  /**
   * This function is an helper for svg import. it returns the center of the object in the svg
   * untransformed coordinates
   * @private
   * @return {Point} center point from element coordinates
   */
  _findCenterFromElement(): Point {
    return new Point((this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2);
  }

  /**
   * Returns object representation of an instance
   * @method toObject
   * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
   * @return {Object} object representation of an instance
   */
  toObject<
    T extends Omit<Props & TClassProperties<this>, keyof SProps>,
    K extends keyof T = never
  >(propertiesToInclude: K[] = []): Pick<T, K> & SProps {
    return {
      ...super.toObject([...propertiesToInclude, ...this.extendPropeties]),
      ...this.calcLinePoints(),

    };
  }

  /*
   * Calculate object dimensions from its properties
   * @private
   */
  _getNonTransformedDimensions(): Point {
    const dim = super._getNonTransformedDimensions();
    if (this.strokeLineCap === 'butt') {
      if (this.width === 0) {
        dim.y -= this.strokeWidth;
      }
      if (this.height === 0) {
        dim.x -= this.strokeWidth;
      }
    }
    return dim;
  }

  /**
   * Recalculates line points given width and height
   * Those points are simply placed around the center,
   * This is not useful outside internal render functions and svg output
   * Is not meant to be for the developer.
   * @private
   */
  calcLinePoints(): UniqueLineProps {
    const { x1: _x1, x2: _x2, y1: _y1, y2: _y2, width, height } = this;
    const xMult = _x1 <= _x2 ? -1 : 1,
      yMult = _y1 <= _y2 ? -1 : 1,
      x1 = (xMult * width) / 2,
      y1 = (yMult * height) / 2,
      x2 = (xMult * -width) / 2,
      y2 = (yMult * -height) / 2;

    return {
      x1,
      x2,
      y1,
      y2,
    };
  }

  /* _FROM_SVG_START_ */

  /**
   * Returns svg representation of an instance
   * @return {Array} an array of strings with the specific svg representation
   * of the instance
   */
  _toSVG() {
    const { x1, x2, y1, y2 } = this.calcLinePoints();
    return [
      '<line ',
      'COMMON_PARTS',
      `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />\n`,
    ];
  }

  /**
   * List of attribute names to account for when parsing SVG element (used by {@link Line.fromElement})
   * @static
   * @memberOf Line
   * @see http://www.w3.org/TR/SVG/shapes.html#LineElement
   */
  static ATTRIBUTE_NAMES = SHARED_ATTRIBUTES.concat(coordProps);

  /**
   * Returns Line instance from an SVG element
   * @static
   * @memberOf Line
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @param {Function} [callback] callback function invoked after parsing
   */
  static fromElement(element: SVGElement, callback: (line: Arrow) => any) {
    const {
      x1 = 0,
      y1 = 0,
      x2 = 0,
      y2 = 0,
      ...parsedAttributes
    } = parseAttributes(element, this.ATTRIBUTE_NAMES),
      points: [number, number, number, number] = [x1, y1, x2, y2];
    callback(new this(points, parsedAttributes));
  }

  /* _FROM_SVG_END_ */
  /** boardx custom function */
  getWidgetMenuList() {
    if (this.locked) {
      return ['objectLock'];
    }
    return [
      'strokeColor',
      'lineWidth',
      'connectorShape',
      'connectorTip',
      'objectLock',
      'borderLineIcon',
      'delete'
    ];
  }
  getWidgetMenuLength() {
    if (this.locked) return 50;
    return 165;
  }
  getContextMenuList() {
    let menuList;
    if (this.locked) {
      menuList = [
        'Bring forward',
        'Bring to front',
        'Send backward',
        'Send to back'
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
        'Delete'
      ];
    }

    if (this.locked) {
      menuList.push('Unlock');
    } else {
      menuList.push('Lock');
    }

    return menuList;
  }

  getCloneLineWidget() {
    const widget = this.toObject();
    const rwidget = widget;
    const lObjwidth = (widget.x1 - widget.x2) * widget.scaleX;
    const lObjheight = (widget.y1 - widget.y2) * widget.scaleY;
    rwidget.x1 = widget.left + 0.5 * lObjwidth;
    rwidget.y1 = widget.top + 0.5 * lObjheight;
    rwidget.x2 = widget.left - 0.5 * lObjwidth;
    rwidget.y2 = widget.top - 0.5 * lObjheight;
    rwidget.scaleX = 1;
    rwidget.scaleY = 1;
    rwidget.width = lObjwidth;
    rwidget.height = lObjheight;
    rwidget.left = widget.left;
    rwidget.top = widget.top;
    rwidget.zIndex = Date.now() * 100;
    return rwidget;
  }

  recalcLinePoints(line: Arrow) {
    const points = line.calcLinePoints();
    const matrix = line.calcTransformMatrix();
    // recalculate the line's start and end point coordinate by transform matrix
    const point1 = transformPoint(
      { x: points.x1, y: points.y1 },
      matrix,
    );
    const point2 = transformPoint(
      { x: points.x2, y: points.y2 },
      matrix,
    );
    line.set('x1', point1.x).set('y1', point1.y);
    line.set('x2', point2.x).set('y2', point2.y);
  }

  calculateEnds(lineObj: any, arrow: any) {
    const position = {
      x1: lineObj.left,
      y1: lineObj.top,
      x2: lineObj.left + (arrow.x2 - arrow.x1),
      y2: lineObj.top + (arrow.y2 - arrow.y1),
    };
    return position;
  }

  getArrowAngle() {
    const x = this.x2 - this.x1;
    const y = this.y2 - this.y1;
    let angle = 0;
    if (x === 0) {
      if (y === 0) {
        angle = 0;
      } else if (y > 0) {
        angle = Math.PI / 2;
      } else {
        angle = (Math.PI * 3) / 2;
      }
    } else if (y === 0) {
      if (x > 0) {
        angle = 0;
      } else {
        angle = Math.PI;
      }
    } else if (x < 0) {
      angle = Math.atan(y / x) + Math.PI;
    } else if (y < 0) {
      angle = Math.atan(y / x) + 2 * Math.PI;
    } else {
      angle = Math.atan(y / x);
    }
    angle = (angle * 180) / Math.PI + 90;
    return angle;
  }

  removeArrowfromConnectObj(oldConnObj: any) {
    oldConnObj.lines = oldConnObj.lines.filter((item: { _id: string; }) => item._id !== this._id);
  }

  drawSegments(ctx: any, keyPoints: any) {
    for (let i = 0; i < keyPoints.length - 1; i++) {
      //const colors = ['black', 'red', 'yellow', 'purple', 'green', 'blue'];
      ctx.beginPath();
      ctx.moveTo(keyPoints[i].x, keyPoints[i].y);
      ctx.lineTo(keyPoints[i + 1].x, keyPoints[i + 1].y);
      //ctx.strokeStyle = colors[i];
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
    }
  }




  /**
   * Returns Line instance from an object representation
   * @static
   * @memberOf Line
   * @param {Object} object Object to create an instance from
   * @returns {Promise<Line>}
   */
  static fromObject<T extends TProps<SerializedLineProps>>({
    x1,
    y1,
    x2,
    y2,
    ...object
  }: T) {
    return this._fromObject<Arrow>(
      {
        ...object,
        points: [x1, y1, x2, y2],
      },
      {
        extraParam: 'points',
      }
    );
  }
}

classRegistry.setClass(Arrow);
classRegistry.setSVGClass(Arrow);
