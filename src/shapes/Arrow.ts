// @ts-nocheck
import { TClassProperties } from '../typedefs';
import { classRegistry } from '../ClassRegistry';
import { Line } from './Line';
import { Control } from '../controls/Control';
import type {
  FabricObjectProps,
  SerializedObjectProps,
  TProps,
} from './Object/types';
import { cacheProperties } from './Object/FabricObject';
import { transformPoint } from '../util/misc/matrix';
import { multiplyTransformMatrices } from '../util/misc/matrix';


const coordProps = ['x1', 'x2', 'y1', 'y2'] as const;

interface UniqueArrowProps {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}
export interface SerializedLineProps
  extends SerializedObjectProps,
  UniqueArrowProps {
}
export const ArrowDefaultValues: Partial<TClassProperties<Arrow>> = {
  minWidth: 20,
  dynamicMinWidth: 2,
  lockScalingFlip: true,
  noScaleCache: false,
  _wordJoiners: /[ \t\r]/,
  splitByGrapheme: true,
  obj_type: 'WBArrow',
  height: 200,
  maxHeight: 200,
  subType: 'arrow',
  hasBorders: false,
};

export interface ArrowProps extends FabricObjectProps, UniqueArrowProps { }

export class Arrow<
  Props extends TProps<ArrowProps> = Partial<ArrowProps>,
> extends Line {

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

  declare timestamp: number;

  public extendPropeties = ['obj_type', 'whiteboardId', 'userId', 'timestamp', 'zIndex', 'locked', 'connectorShape', '_id', 'subType', 'perPixelTargetFind', 'userNo', 'connectorEnd', 'connectorStart', 'connectorType', 'tips', 'connectorStyle', 'timestamp'];

  static cacheProperties = [...cacheProperties, ...coordProps];

  static ownDefaults: Record<string, any> = ArrowDefaultValues;

  static getDefaults() {
    return {
      ...super.getDefaults(),
      ...Arrow.ownDefaults,
    };
  }

  declare keys: [
    '_id', // string, the id of the object
    'angle', //  integer, angle for recording rotating
    'backgroundColor', // string,  background color, works when the image is transparent
    'fill', // the font color
    'width', // integer, width of the object
    'height', // integer, height of the object
    'left', // integer left for position
    'locked', // boolean, lock status for the widget， this is connected to lock
    'lockScalingX',
    'lockScalingY',
    'lockMovementX', // boolean, lock the verticle movement
    'lockMovementY', // boolean, lock the horizontal movement
    'lockScalingFlip', // boolean,  make it can not be inverted by pulling the width to the negative side
    'obj_type', // object type
    'originX', // string, Horizontal origin of transformation of an object (one of "left", "right", "center") See http://jsfiddle.net/1ow02gea/244/ on how originX/originY affect objects in groups
    'originY', // string, Vertical origin of transformation of an object (one of "top", "bottom", "center") See http://jsfiddle.net/1ow02gea/244/ on how originX/originY affect objects in groups
    'scaleX', // nunber, Object scale factor (horizontal)
    'scaleY', // number, Object scale factor (vertical)
    'selectable', // boolean, When set to `false`, an object can not be selected for modification (using either point-click-based or group-based selection). But events still fire on it.
    'top', // integer, Top position of an object. Note that by default it's relative to object top. You can change this by setting originY={top/center/bottom}
    'userNo', // string, the unique id for the user, one user id could open mutiple browser, each browser has unique user no
    'userId', // string, user identity
    'whiteboardId', // whiteboard id, string
    'zIndex', // the index for the object on whiteboard, integer
    'version', // version of the app, string
    'type', // widget type, string
    'panelObj', // if this is a panel, the id of the panel, string
    'relationship', // array, viewporttransform
    'stroke', // line color
    'strokeWidth', // line width
    'strokeUniform', // set up to true then strokewidth doesn't change when scaling
    'connectorEnd', // connectorEnd: {_id: "F8B6zJQv8LFQyP8ux", relativeX: 0.5, relativeY: 0.5}
    'connectorStart', // connectorStart: {_id: "aAodW5XBxPwPZqDNc", relativeX: 0.0, relativeY: -0.5}
    'x1', // : 534.2749784296807
    'x2', // : 418.5215421268829
    'y1', // : 352.6321915444349
    'y2', // : 311.233166726342
    'connectorShape', // straight, angled, curved
    'connectorStyle', // solid, dashed, dotted
    'tips', // string, both, start, end, none
  ]
  /**
 * Constructor
 * @param {Array} [points] Array of points
 * @param {Object} [options] Options object
 * @return {Line} thisArg
 */
  constructor([x1, y1, x2, y2] = [0, 0, 0, 0], options: Props = {} as Props) {
    super([x1, y1, x2, y2], options);
    this._setWidthHeight();

    const { left, top } = options;
    typeof left === 'number' && this.set('left', left);
    typeof top === 'number' && this.set('top', top);
    if (
      options.strokeWidth !== 2 &&
      options.strokeWidth !== 4 &&
      options.strokeWidth !== 8
    ) {
      options.strokeWidth = 4;
    }
    this.controls = {
      start: new Control({
        cursorStyle: 'crosshair', //
        //@ts-ignore
        mouseDownHandler: (eventData, transformData) => {
          this.mousedownProcess(transformData, eventData, true);
        },
        positionHandler: (dim, finalMatrix, fabricObject) => {
          return this.positionProcess(fabricObject, true);
        },
        actionHandler: (eventData, transform, x, y) => {
          const target: any = transform.target;
          if (target.locked) return;

          const hoverTarget = this.canvas.findTarget(eventData);
          console.log('hoverTarget', hoverTarget, target, hoverTarget === target);
          if (hoverTarget && hoverTarget.obj_type === 'WBArrow') return;

          if (hoverTarget) {
            if (
              target.connectorEnd &&
              hoverTarget._id === target.connectorEnd._id
            )
              return;

            this.canvas.setActiveObject(hoverTarget);
            const minPoint = this.calcDistanceToTarget({ x, y }, hoverTarget);
            hoverTarget.__corner = minPoint.dot;

            target.setConnectorObj(hoverTarget, minPoint, false, true);
            // target.set('x1', minPoint.x).set('y1', minPoint.y);
          } else {
            this.canvas.discardActiveObject();
            const oldConnObj =
              target.connectorStart && target.connectorStart._id
                ? this.canvas.findById(target.connectorStart._id)
                : null;

            if (oldConnObj && oldConnObj.lines)
              oldConnObj.lines = oldConnObj.lines.filter(
                item => item._id !== target._id
              );

            target.set('x1', x + 5).set('y1', y + 5);
            target.connectorStart = null;
          }
          target.setCoords();
          this.canvas.requestRenderAll();
          return true;
        }
      }),

      end: new Control({
        cursorStyle: 'crosshair',
        //@ts-ignore
        mouseDownHandler: (eventData, transformData) => {
          this.mousedownProcess(transformData, eventData, false);
        },
        positionHandler: (dim, finalMatrix, fabricObject) => {
          return this.positionProcess(fabricObject, false);
        },
        actionHandler: (eventData, transform, x, y) => {
          const target: any = transform.target;
          if (target.locked) return;

          const hoverTarget = this.canvas.findTarget(eventData);

          if (hoverTarget && hoverTarget.obj_type === 'WBArrow') return;

          if (hoverTarget) {
            if (
              target.connectorStart &&
              hoverTarget._id === target.connectorStart._id
            )
              return;

            this.canvas.setActiveObject(hoverTarget);
            const minPoint = this.calcDistanceToTarget({ x, y }, hoverTarget);
            hoverTarget.__corner = minPoint.dot;

            target.setConnectorObj(hoverTarget, minPoint, false, false);
            // target.set('x2', minPoint.x).set('y2', minPoint.y);
          } else {
            this.canvas.discardActiveObject();

            const oldConnObj =
              target.connectorEnd && target.connectorEnd._id
                ? this.canvas.findById(target.connectorEnd._id)
                : null;

            if (oldConnObj && oldConnObj.lines)
              oldConnObj.lines = oldConnObj.lines.filter(
                item => item._id !== target._id
              );

            target.set('x2', x - 5).set('y2', y - 5);
            target.connectorEnd = null;
          }
          target.setCoords();
          this.canvas.requestRenderAll();

          return true;
        }
      })
    };
    const acc = [];
    for (let i = 0; i <= 4; i += 2) {
      acc[i] = new Control({
        cursorStyle: 'pointer',
        pointIndex: i,
        actionName: 'modifyCurve',

        //@ts-ignore
        mouseDownHandler: (eventData, transformData) => {
          this.mousedownProcess(transformData, eventData, false);
        },
        positionHandler: (dim, finalMatrix, fabricObject) => {
          return this.positionProcess(fabricObject, false);
        },
        actionHandler: (eventData, transform, x, y) => {
          const target: any = transform.target;
          if (target.locked) return;

          const hoverTarget = this.canvas.findTarget(eventData);

          if (hoverTarget && hoverTarget.obj_type === 'WBArrow') return;

          if (hoverTarget) {
            if (
              target.connectorStart &&
              hoverTarget._id === target.connectorStart._id
            )
              return;

            this.canvas.setActiveObject(hoverTarget);
            const minPoint = this.calcDistanceToTarget({ x, y }, hoverTarget);
            hoverTarget.__corner = minPoint.dot;

            target.setConnectorObj(hoverTarget, minPoint, false, false);
            // target.set('x2', minPoint.x).set('y2', minPoint.y);
          } else {
            this.canvas.discardActiveObject();

            const oldConnObj =
              target.connectorEnd && target.connectorEnd._id
                ? this.canvas.findById(target.connectorEnd._id)
                : null;

            if (oldConnObj && oldConnObj.lines)
              oldConnObj.lines = oldConnObj.lines.filter(
                item => item._id !== target._id
              );

            target.set('(x2+x1)/2', x - 5).set('(y1+y2)/2', y - 5);
            //target.connectorEnd = null;
          }
          target.setCoords();
          this.canvas.requestRenderAll();

          return true;
        }
      });
    }
    this.lockScalingX = true;
    this.lockScalingY = true;
    this.lockScalingFlip = true;
    if (
      options.strokeWidth !== 2 &&
      options.strokeWidth !== 4 &&
      options.strokeWidth !== 8
    ) {
      options.strokeWidth = 4;
    }
    this.initEvents(options);
  }

  initEvents(options) {
    console.log('initEvents')
    return;
  }

  getObject() {
    const object = {};
    this.keys.forEach((key) => {
      object[key] = this[key];
    });
    return object;
  }

  toObject(propertiesToInclude: Array<any>): object {
    return super.toObject(
      [...this.extendPropeties, 'minWidth', 'splitByGrapheme'].concat(propertiesToInclude)
    );

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
  recalcLinePoints(line) {
    const points = line.calcLinePoints();
    const matrix = line.calcTransformMatrix();
    // recalculate the line's start and end point coordinate by transform matrix
    const point1 = transformPoint(
      //@ts-ignore
      { x: points.x1, y: points.y1 },
      matrix
    );
    const point2 = transformPoint(
      //@ts-ignore
      { x: points.x2, y: points.y2 },
      matrix
    );
    line.set('x1', point1.x).set('y1', point1.y);
    line.set('x2', point2.x).set('y2', point2.y);
  }
  calculateEnds(lineObj, arrow) {
    const position = {
      x1: lineObj.left,
      y1: lineObj.top,
      x2: lineObj.left + (arrow.x2 - arrow.x1),
      y2: lineObj.top + (arrow.y2 - arrow.y1)
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
  getresetArrowaftermoving() {
    const lineObj = this.canvas.findById(this._id).getCloneLineWidget();
    const scalex = lineObj.scaleX;
    const scaley = lineObj.scaleY;
    const position = {
      x1: lineObj.left,
      y1: lineObj.top,
      x2: lineObj.left + (lineObj.x2 - lineObj.x1),
      y2: lineObj.top + (lineObj.y2 - lineObj.y1)
    };

    const lObjwidth = (lineObj.x1 - lineObj.x2) * scalex;
    const lObjheight = (lineObj.y1 - lineObj.y2) * scaley;
    this.x1 = position.x1 + 0.5 * lObjwidth;
    this.y1 = position.y1 + 0.5 * lObjheight;
    this.x2 = position.x1 - 0.5 * lObjwidth;
    this.y2 = position.y1 - 0.5 * lObjheight;
    this.scaleX = 1;
    this.scaleY = 1;
    this.height = Math.abs(lineObj.height);
    this.width = Math.abs(lineObj.width);
    this.setCoords();
    this.canvas.requestRenderAll();
  }
  removeArrowfromConnectObj(oldConnObj) {
    oldConnObj.lines = oldConnObj.lines.filter(item => item._id !== this._id);
  }
  resetStrokeAfterScaling() {
    /* have to discard any active first */
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(this);
    this.canvas.discardActiveObject();
  }
  _renderbk(ctx) {
    const p = this.calcLinePoints();
    const angle = this.getArrowAngle();
    const currZoom = this.canvas.getZoom();
    ctx.lineWidth =
      currZoom > 1.0 ? this.strokeWidth / currZoom : this.strokeWidth;
    if (!this.ctx) {
      this.ctx = ctx;
    }
    if (this.connectorStyle === 'dashed') {
      ctx.setLineDash([8, 20]);
    } else if (this.connectorStyle === 'dotted') {
      ctx.setLineDash([1, 15]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.stroke;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    const { rx: rx1, ry: ry1 } = this.connectorStart || {};
    const { rx: rx2, ry: ry2 } = this.connectorEnd || {};
    const BL = 30;
    const BASE_LENGTH = currZoom > 1.0 ? BL / currZoom : BL;
    const { x1, x2, y1, y2 } = p;

    const SLOPE_MAP = {
      RIGHT: 'RIGHT',
      LEFT: 'LEFT',
      UP: 'UP',
      DOWN: 'DOWN'
    };
    Object.freeze(SLOPE_MAP);
    let slopeToDirection;
    let endSlopeToDirection;

    let pen = { x: x1, y: y1 };
    const lineTo = (coordinate: any = {}) => {
      if (
        pen.x !== coordinate.x &&
        pen.y !== coordinate.y &&
        coordinate.x !== undefined &&
        coordinate.y !== undefined
      ) {
        pen.x !== coordinate.x && lineTo({ x: coordinate.x });
        pen.y !== coordinate.y && lineTo({ y: coordinate.y });
        return;
      } else {
        if (coordinate.x === undefined) {
          if (
            slopeToDirection === SLOPE_MAP.UP &&
            x1 < 0 &&
            y1 < 0 &&
            pen.y < coordinate.y
          ) {
            if (pen.x < 0) {
              lineTo({ x: 0 });
              return;
            }
          }
        }
        pen = { ...pen, ...coordinate };
        ctx.lineTo(pen.x, pen.y);
      }
    };
    const getSlope = ({ x1, x2, y1, y2 }) => {
      return (y1 - y2) / (x1 - x2);
    };
    const getSlopeWithZero = ({ x, y }) => {
      return getSlope({ x1: 0, x2: x, y1: 0, y2: y });
    };

    const slope = getSlopeWithZero({ x: rx1, y: ry1 });
    const endSlope = getSlopeWithZero({ x: rx2, y: ry2 });

    if (-1 < slope && slope < 1) {
      if (rx1 < 0) {
        slopeToDirection = SLOPE_MAP.LEFT;
      } else {
        slopeToDirection = SLOPE_MAP.RIGHT;
      }
    }
    if (slope > 1 || slope < -1) {
      if (ry1 < 0) {
        slopeToDirection = SLOPE_MAP.UP;
      } else {
        slopeToDirection = SLOPE_MAP.DOWN;
      }
    }
    if (-1 < endSlope && endSlope < 1) {
      if (rx2 < 0) {
        endSlopeToDirection = SLOPE_MAP.LEFT;
      } else {
        endSlopeToDirection = SLOPE_MAP.RIGHT;
      }
    }
    if (endSlope > 1 || endSlope < -1) {
      if (ry2 < 0) {
        endSlopeToDirection = SLOPE_MAP.UP;
      } else {
        endSlopeToDirection = SLOPE_MAP.DOWN;
      }
    }
    if (this.connectorShape === 'angled') {
      ctx.moveTo(p.x1, p.y1);

      if (slopeToDirection === SLOPE_MAP.UP) {
        lineTo({ y: y1 - BASE_LENGTH });
      }
      if (slopeToDirection === SLOPE_MAP.RIGHT) {
        lineTo({ x: x1 + BASE_LENGTH });
      }
      if (slopeToDirection === SLOPE_MAP.DOWN) {
        lineTo({ y: y1 + BASE_LENGTH });
      }
      if (slopeToDirection === SLOPE_MAP.LEFT) {
        lineTo({ x: x1 - BASE_LENGTH });
      }

      if (x1 < x2 && y1 < y2) {
        lineTo({ y: p.y2 - (p.y2 - p.y1) / 2 });
      }
      if (endSlopeToDirection === SLOPE_MAP.UP) {
        lineTo({ y: y2 - BASE_LENGTH });
      }
      if (endSlopeToDirection === SLOPE_MAP.RIGHT) {
        lineTo({ x: x2 + BASE_LENGTH });
        lineTo({ y: p.y2 });
      }
      if (endSlopeToDirection === SLOPE_MAP.DOWN) {
        lineTo({ y: y2 + BASE_LENGTH });
      }
      if (endSlopeToDirection === SLOPE_MAP.LEFT) {
        lineTo({ x: x2 - BASE_LENGTH });
        lineTo({ y: p.y2 });
      }

      lineTo({ x: x2, y: p.y2 });
      ctx.stroke();
    } else if (this.connectorShape === 'curved') {
      if (
        Math.round(angle / 90) * 90 === 180 ||
        (Math.round(angle / 90) * 90) % 360 === 0
      ) {
        ctx.moveTo(p.x1, p.y1);
        const py21 = (p.y2 - p.y1) / 3;
        ctx.bezierCurveTo(p.x1, p.y1 + py21, p.x2, p.y2 - py21, p.x2, p.y2);
        ctx.stroke();
      } else {
        ctx.moveTo(p.x1, p.y1);
        const px21 = (p.x2 - p.x1) / 3;
        ctx.bezierCurveTo(p.x1 + px21, p.y1, p.x2 - px21, p.y2, p.x2, p.y2);
        ctx.stroke();
      }
    } else {
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    }
    if (this.connectorShape === 'curved' || this.connectorShape === 'angled') {
      if (this.subType === 'arrow') {
        const reAngle = angle % 360;
        let fixAngle = null;
        if (reAngle < 45) {
          fixAngle = 0;
        } else if (reAngle < 135) {
          fixAngle = 90;
        } else if (reAngle < 225) {
          fixAngle = 180;
        } else if (reAngle < 315) {
          fixAngle = 270;
        } else {
          fixAngle = 0;
        }

        if (this.connectorShape === 'angled') {
          if (endSlopeToDirection === SLOPE_MAP.UP) {
            fixAngle = 180;
          }
          if (endSlopeToDirection === SLOPE_MAP.RIGHT) {
            fixAngle = 270;
          }
          if (endSlopeToDirection === SLOPE_MAP.DOWN) {
            fixAngle = 1;
          }
          if (endSlopeToDirection === SLOPE_MAP.LEFT) {
            fixAngle = 90;
          }
        }
        this.drawArrowTips(ctx, p, fixAngle);
      }
    } else if (this.subType === 'arrow') {
      this.drawArrowTips(ctx, p);
    }
  }
  spmyconvert(xs) {
    const l = [];
    for (let i = 0; i < xs.length; i++) {
      l.push(xs[i].x);
      l.push(xs[i].y);
    }
    return l;
  }
  spdrawCurve(ctx, ptsa, tension, isClosed, numOfSegments) {
    ctx.beginPath();
    this.spdrawLines(
      ctx,
      this.spgetCurvePoints(ptsa, tension, isClosed, numOfSegments)
    );

    ctx.stroke();
  }
  spgetCurvePoints(pts, tension, isClosed, numOfSegments) {
    // use input value if provided, or use a default value
    tension = typeof tension != 'undefined' ? tension : 0.5;
    isClosed = isClosed ? isClosed : false;
    numOfSegments = numOfSegments ? numOfSegments : 16;

    const _pts = [];
    const res = []; // clone array
    let x;
    let y; // our x,y coords
    let t1x;
    let t2x;
    let t1y;
    let t2y; // tension vectors
    let c1;
    let c2;
    let c3;
    let c4; // cardinal points
    let st;
    let t;
    let i; // steps based on num. of segments

    // clone array so we don't change the original
    //
    _pts = pts.slice(0);

    // The algorithm require a previous and next point to the actual point array.
    // Check if we will draw closed or open curve.
    // If closed, copy end points to beginning and first points to end
    // If open, duplicate first points to befinning, end points to end
    if (isClosed) {
      _pts.unshift(pts[pts.length - 1]);
      _pts.unshift(pts[pts.length - 2]);
      _pts.unshift(pts[pts.length - 1]);
      _pts.unshift(pts[pts.length - 2]);
      _pts.push(pts[0]);
      _pts.push(pts[1]);
    } else {
      _pts.unshift(pts[1]); //copy 1. point and insert at beginning
      _pts.unshift(pts[0]);
      _pts.push(pts[pts.length - 2]); //copy last point and append
      _pts.push(pts[pts.length - 1]);
    }

    // ok, lets start..

    // 1. loop goes through point array
    // 2. loop goes through each segment between the 2 pts + 1e point before and after
    for (i = 2; i < _pts.length - 4; i += 2) {
      for (t = 0; t <= numOfSegments; t++) {
        // calc tension vectors
        t1x = (_pts[i + 2] - _pts[i - 2]) * tension;
        t2x = (_pts[i + 4] - _pts[i]) * tension;

        t1y = (_pts[i + 3] - _pts[i - 1]) * tension;
        t2y = (_pts[i + 5] - _pts[i + 1]) * tension;

        // calc step
        st = t / numOfSegments;

        // calc cardinals
        c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1;
        c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2);
        c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st;
        c4 = Math.pow(st, 3) - Math.pow(st, 2);
        const left = 0; //_pts[0]; this.left
        const top = 0; //_pts[ 1]; this.top

        // calc x and y cords with common control vectors
        x = c1 * _pts[i] + c2 * _pts[i + 2] + c3 * t1x + c4 * t2x + left;
        y = c1 * _pts[i + 1] + c2 * _pts[i + 3] + c3 * t1y + c4 * t2y + top;

        //console.log(this.left, this.top);
        //store points in array
        res.push(x);
        res.push(y);
      }
    }
    return res;
  }
  spdrawLines(ctx, pts) {
    ctx.moveTo(pts[0], pts[1]);
    let i;
    for (i = 2; i < pts.length - 1; i += 2) {
      ctx.strokeStyle = this.stroke; //'red';

      ctx.lineTo(pts[i], pts[i + 1]);
      ctx.stroke();
    }
  }
  _render(ctx) {
    const p = this.calcLinePoints();
    if (!this.ctx) this.ctx = ctx;
    ctx.lineWidth = (this.strokeWidth * 1) / Math.max(this.canvas.getZoom(), 1);
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.stroke;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const connStartObj = this.canvas.findById(this.connectorStart?._id);
    const connEndObj = this.canvas.findById(this.connectorEnd?._id);

    if (this.connectorShape === 'straight') {
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
      if (this.subType === 'arrow') {
        this.drawArrowTips(ctx, p);
      }
    } else if (this.connectorShape === 'curved') {
      //console.log('connStartObj', connStartObj, 'connEndObj', connEndObj);
      //console.log('line', this.x1, this.y1, this.x2, this.y2);
      let endAngle = 90;
      let startAngle = 270;
      let offset = 0;
      let etype = 'f';
      let stype = 'f';

      if (p.x1 < p.x2) {
        startAngle = 90;
        endAngle = 270;
      } else {
        startAngle = 270; //270;
        endAngle = 90; //90;
      }
      let sp = { x: p.x1, y: p.y1 },
        ep = { x: p.x2, y: p.y2 };

      if (connEndObj || connStartObj) {
        offset = 30;

        const threshold = 0.05;
        if (this.connectorStart) {
          if (Math.abs(this.connectorStart.ry - 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 180;
            stype = 'b';
          } else if (Math.abs(this.connectorStart.ry + 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 0;
            stype = 'u';
          } else if (Math.abs(this.connectorStart.rx - 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 90;
            stype = 'r';
          } else if (Math.abs(this.connectorStart.rx + 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 270;
            stype = 'l';
          }
        }

        if (this.connectorEnd) {

          if (Math.abs(this.connectorEnd.ry - 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 180;
            etype = 'b';
          } else if (Math.abs(this.connectorEnd.ry + 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 0;
            etype = 'u';
          } else if (Math.abs(this.connectorEnd.rx - 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 90;
            etype = 'r';
          } else if (Math.abs(this.connectorEnd.rx + 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 270;
            etype = 'l';
          }
        }
      }
      this.drawBeizerBody(
        ctx,
        p,
        offset,
        stype,
        etype,
        connStartObj,
        connEndObj,
        startAngle,
        endAngle
      );
    } else if (this.connectorShape === 'straight5') {
      let endAngle = 90;
      let startAngle = 270;
      let sx1a = 0;
      let sy1a = offset;
      let sx2a = 0;
      let sy2a = offset;

      console.log('in curved ', p.x1, p.y1, p.x2, p.y2);

      let sp = { x: p.x1, y: p.y1 },
        ep = { x: p.x2, y: p.y2 };

      if (connEndObj || connStartObj) {
        offset = 20;

        const threshold = 0.05;
        if (this.connectorStart) {

          if (Math.abs(this.connectorStart.ry - 0.5) <= threshold) {

            sp = { x: p.x1, y: p.y1 };
            startAngle = 180;
            sx1a = 0;
            sy1a = offset;
            stype = 'b';
          } else if (Math.abs(this.connectorStart.ry + 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 0;
            sx1a = 0;
            sy1a = -offset;
            stype = 'u';
          } else if (Math.abs(this.connectorStart.rx - 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 90;
            sx1a = offset;
            sy1a = 0;
            stype = 'r';
          } else if (Math.abs(this.connectorStart.rx + 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 270;
            sx1a = -offset;
            sy1a = 0;
            stype = 'l';
          }
        }

        if (this.connectorEnd) {

          if (Math.abs(this.connectorEnd.ry - 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 180;
            sx2a = 0;
            sy2a = offset;
            etype = 'b';

          } else if (Math.abs(this.connectorEnd.ry + 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 0;
            sx2a = 0;
            sy2a = -offset;
            etype = 'u';

          } else if (Math.abs(this.connectorEnd.rx - 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 90;
            sx2a = offset;
            sy2a = 0;
            etype = 'r';

          } else if (Math.abs(this.connectorEnd.rx + 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 270;
            sx2a = -offset;
            sy2a = 0;
            etype = 'l';

          }
        }
      }
      const sx1 = p.x1 + sx1a;
      const sy1 = p.y1 + sy1a;
      const sx2 = p.x2 + sx2a;
      const sy2 = p.y2 + sy2a;

      {
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(sx1, sy1);
        ctx.stroke();
        ctx.moveTo(sx1, sy1);
        const py21 = (sy2 - sy1) / 3;
        ctx.bezierCurveTo(sx1, sy1 + py21, sx2, sy2 - py21, sx2, sy2);
        ctx.stroke();
        ctx.moveTo(p.x2, p.y2);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }
      if (this.tips === 'start' || this.tips === 'both')
        this.drawArrowTip(ctx, sp, startAngle);
      if (this.tips === 'end' || this.tips === 'both')
        this.drawArrowTip(ctx, ep, endAngle);
    } else if (this.connectorShape == 'straight6') {
      const pts = [
        {
          x: p.x1,
          y: p.y1
        },
        {
          x: p.x1 + (p.x2 - p.x1) / 6,
          y: p.y1 + (2 * (p.y2 - p.y1)) / 6
        },
        {
          x: p.x1 + (3 * (p.x2 - p.x1)) / 6,
          y: p.y1 + (3 * (p.y2 - p.y1)) / 6
        },
        {
          x: p.x1 + (4 * (p.x2 - p.x1)) / 6,
          y: p.y1 + (5 * (p.y2 - p.y1)) / 6
        },
        {
          x: p.x1 + (5 * (p.x2 - p.x1)) / 6,
          y: p.y1 + (5 * (p.y2 - p.y1)) / 6
        },
        {
          x: p.x2,
          y: p.y2
        }
      ];

      this.spdrawCurve(ctx, this.spmyconvert(pts), 0.5); //default tension=0.5
    } else if (this.connectorShape === 'curvedold') {
      //curved
      const angle = this.getArrowAngle();
      offset = 40;
      if (
        Math.round(angle / 90) * 90 === 180 ||
        (Math.round(angle / 90) * 90) % 360 === 0
      ) {
        ctx.moveTo(p.x1, p.y1);
        const py21 = (p.y2 - p.y1) / 3;
        ctx.bezierCurveTo(p.x1, p.y1 + py21, p.x2, p.y2 - py21, p.x2, p.y2);
        ctx.stroke();
      } else {
        ctx.moveTo(p.x1, p.y1);
        const px21 = (p.x2 - p.x1) / 3;
        ctx.bezierCurveTo(p.x1 + px21, p.y1, p.x2 - px21, p.y2, p.x2, p.y2);
        ctx.stroke();
      }
      if (this.subType === 'arrow') {
        this.drawArrowTips(ctx, p);
      }
    }
    if (this.connectorShape === 'angled') {
      //console.log('connStartObj', connStartObj, 'connEndObj', connEndObj);
      //console.log('line', this.x1, this.y1, this.x2, this.y2);
      let endAngle = 90;
      let startAngle = 270;
      let offset = 0;
      let etype = 'f';
      let stype = 'f';

      if (p.x1 < p.x2) {
        startAngle = 90;
        endAngle = 270;
      } else {
        startAngle = 270;
        endAngle = 90;
      }
      let sp = { x: p.x1, y: p.y1 },
        ep = { x: p.x2, y: p.y2 };

      if (connEndObj || connStartObj) {
        offset = 30;

        const threshold = 0.05;
        if (this.connectorStart) {

          if (Math.abs(this.connectorStart.ry - 0.5) <= threshold) {

            sp = { x: p.x1, y: p.y1 };
            startAngle = 180;
            stype = 'b';
          } else if (Math.abs(this.connectorStart.ry + 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 0;
            stype = 'u';
          } else if (Math.abs(this.connectorStart.rx - 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 90;
            stype = 'r';
          } else if (Math.abs(this.connectorStart.rx + 0.5) <= threshold) {
            sp = { x: p.x1, y: p.y1 };
            startAngle = 270;
            stype = 'l';
          }
        }

        if (this.connectorEnd) {

          if (Math.abs(this.connectorEnd.ry - 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 180;
            etype = 'b';

          } else if (Math.abs(this.connectorEnd.ry + 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 0;
            etype = 'u';

          } else if (Math.abs(this.connectorEnd.rx - 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 90;
            etype = 'r';

          } else if (Math.abs(this.connectorEnd.rx + 0.5) <= threshold) {
            ep = { x: p.x2, y: p.y2 };
            endAngle = 270;
            etype = 'l';

          }
        }
      }

      if (this.tips === 'start' || this.tips === 'both')
        this.drawArrowTip(ctx, sp, startAngle);
      if (this.tips === 'end' || this.tips === 'both')
        this.drawArrowTip(ctx, ep, endAngle);

      this.drawBody(ctx, p, offset, stype, etype, connStartObj, connEndObj);
    }
  }
  drawBeizerBody(
    ctx,
    p,
    offset,
    stype,
    etype,
    connStartObj,
    connEndObj,
    startAngle,
    endAngle
  ) {
    offset = 20;
    let start; let cp1; let cp2; let end; let newstart; let newend; let fPoints;

    start = { x: p.x1, y: p.y1 };
    end = { x: p.x2, y: p.y2 };
    newstart = { x: start.x + offset, y: start.y };
    newend = { x: end.x - offset, y: end.y };
    cp2 = { x: p.x1, y: p.y2 };
    cp1 = { x: p.x2, y: p.y1 };

    if (stype === 'f' && etype === 'f') {
      if (p.x1 < p.x2) {
        newstart = { x: start.x + offset, y: start.y };
        newend = { x: end.x - offset, y: end.y };
      } else {
        newstart = { x: start.x - offset, y: start.y };
        newend = { x: end.x + offset, y: end.y };
      }
      cp2 = { x: newstart.x, y: newend.y };
      cp1 = { x: newend.x, y: newstart.y };
    }

    if (stype === 'f' && etype !== 'f') {
      if (etype === 'r') {
        newend = { x: end.x + offset, y: end.y };
        if (p.x1 < p.x2) {
          newstart = { x: start.x + offset, y: start.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = cp1;
        } else {
          newstart = { x: start.x - offset, y: start.y };
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = { x: newend.x, y: newstart.y };
        }
      }
      if (etype === 'l') {
        if (p.x1 < p.x2) {
          newstart = { x: start.x + offset, y: start.y };
          newend = { x: end.x - offset, y: end.y };
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = { x: newend.x, y: newstart.y };
        } else {
          newstart = { x: start.x - offset, y: start.y };
          newend = { x: end.x - offset, y: end.y };
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = cp1;
        }
      }
      if (etype === 'u') {
        newend = { x: end.x, y: end.y - offset };
        if (start.y < end.y) {
          newstart = { x: start.x, y: start.y + offset };
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = { x: newend.x, y: newstart.y };
          startAngle = 180;
        } else {
          newstart = { x: start.x, y: start.y - offset };

          cp2 = { x: newstart.x, y: newend.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp1 = cp2;

          startAngle = 0;
        }
      }

      if (etype === 'b') {
        newend = { x: end.x, y: end.y + offset };
        if (p.y1 < p.y2) {
          newstart = { x: start.x, y: start.y + offset };
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = cp2;
          startAngle = 180;
        } else {
          newstart = { x: start.x, y: start.y - offset };
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = { x: newend.x, y: newstart.y };
          startAngle = 0;
        }
      }
    } else if (stype !== 'f' && etype === 'f') {
      if (stype === 'r') {
        newstart = { x: start.x + offset, y: start.y };
        if (start.x < end.x) {
          newend = { x: end.x - offset, y: end.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = { x: newstart.x, y: newend.y };
        } else {
          newend = { x: end.x + offset, y: end.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = cp2;
        }
      } else if (stype === 'l') {
        newstart = { x: start.x - offset, y: start.y };
        if (start.x < end.x) {
          newend = { x: end.x - offset, y: end.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = cp2;
        } else {
          newend = { x: end.x + offset, y: end.y };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = { x: newstart.x, y: newend.y };
        }
      } else if (stype === 'u') {
        newstart = { x: start.x, y: start.y - offset };
        if (start.y < end.y) {
          newend = { x: end.x, y: end.y - offset };
          cp2 = { x: newend.x, y: newstart.y };
          cp1 = cp2;
          endAngle = 0;
        } else {
          newend = { x: end.x, y: end.y + offset };
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = { x: newend.x, y: newstart.y };
          endAngle = 180;
        }
      } else if (stype === 'b') {
        newstart = { x: start.x, y: start.y + offset };

        if (start.y < end.y) {
          newend = { x: end.x, y: end.y - offset };
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = { x: newend.x, y: newstart.y };
          endAngle = 0;
        } else {
          newend = { x: end.x, y: end.y + offset };
          cp1 = { x: newend.x, y: newstart.y };
          cp2 = cp1;
          endAngle = 180;
        }
      }
    } else if (stype !== 'f' && etype !== 'f') {
      if (stype == 'r' && etype === 'l') {
        if (start.x < end.x) {
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = { x: newend.x, y: newstart.y };
        } else {
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = { x: newend.x, y: newstart.y };
        }
      }
      if (stype == 'r' && etype === 'r') {
        newend = { x: end.x + offset, y: end.y };

        if (start.x < end.x) {

          cp1 = { x: newend.x, y: newstart.y };
          cp2 = cp1;
        } else {
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = cp1;
        }
      }
      if (stype == 'r' && etype === 'u') {
        newstart = { x: start.x + offset, y: start.y };
        newend = { x: end.x, y: end.y - offset };
        if (start.y < end.y) {
          if (start.x > end.x) {
            cp2 = { x: newstart.x, y: newend.y };
            cp1 = cp2;
          } else {
            cp1 = { x: newend.x, y: newstart.y };
            cp2 = cp1;
          }
        } else {
          cp1 = { x: newstart.x, y: newend.y };
          cp2 = cp1;
        }
      }
      if (stype == 'r' && etype === 'b') {
        newend = { x: end.x, y: end.y + offset };
        if (start.y < end.y) {
          cp2 = { x: newstart.x, y: newend.y };
          cp1 = cp2;
        } else {
          if (start.x > end.x) {
            cp1 = { x: newstart.x, y: newend.y };
            cp2 = cp1;
          } else {
            cp2 = { x: newend.x, y: newstart.y };
            cp1 = cp2;
          }
        }
      }
      if (stype == 'l') {
        newstart = { x: start.x - offset, y: start.y };
        if (etype === 'r') {
          newend = { x: end.x + offset, y: end.y };
          if (start.x < end.x) {
            cp2 = { x: newend.x, y: newstart.y };
            cp1 = { x: newstart.x, y: newend.y };

          } else {
            cp2 = { x: newstart.x, y: newend.y };
            cp1 = { x: newend.x, y: newstart.y };
          }
        }
        if (etype === 'l') {
          if (start.x < end.x) {
            cp1 = { x: newstart.x, y: newend.y };
            cp2 = cp1;
          } else {
            cp2 = { x: newend.x, y: newstart.y };
            cp1 = cp2;
          }
        }
        if (etype === 'u') {
          newend = { x: end.x, y: end.y - offset };
          if (start.y < end.y) {
            if (start.x < end.x) {
              cp2 = { x: newstart.x, y: newend.y };
              cp1 = cp2;
            } else {
              cp1 = { x: newend.x, y: newstart.y };
              cp2 = cp1;
            }
          } else {
            if (start.x < end.x) {
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = cp1;
            } else {
              cp2 = { x: newstart.x, y: newend.y };
              cp1 = { x: newend.x, y: newstart.y };
            }
          }
        }
        if (etype === 'b') {
          newend = { x: end.x, y: end.y + offset };
          if (start.y < end.y) {
            cp2 = { x: newstart.x, y: newend.y };
            cp1 = cp2;
          } else {
            if (start.x < end.x) {
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = cp1;
            } else {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          }
        }
      }
      if (stype == 'u') {
        newstart = { x: start.x, y: start.y - offset };
        if (etype === 'r') {
          newend = { x: end.x + offset, y: end.y };
          if (start.x < end.x) {
            if (start.y < end.y) {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            } else {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = { x: newstart.x, y: newend.y };
            }
          } else {
            if (start.y < end.y) {
              cp2 = { x: newstart.x, y: newend.y };
              cp1 = { x: newend.x, y: newstart.y };
            } else {
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = cp1;
            }
          }
        }
        if (etype === 'l') {
          newend = { x: end.x - offset, y: end.y };
          endAngle = 90;

          if (start.x < end.x) {
            if (start.y < end.y) {
              //cp1={x:newstart.x, y:newend.y};
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            } else {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = { x: newstart.x, y: newend.y };
            }
          } else {
            //cp1={x:newstart.x, y:newend.y};
            cp2 = { x: newend.x, y: newstart.y };
            cp1 = cp2;
          }
        }
        if (etype === 'u') {
          newend = { x: end.x, y: end.y - offset };
          if (start.y < end.y) {
            if (start.x < end.x) {
              //cp2={x:newstart.x, y:newend.y};
              cp1 = { x: newend.x, y: newstart.y };
              cp2 = cp1;
            } else {
              //cp2 = { x: newstart.x, y: newend.y };
              cp1 = { x: newend.x, y: newstart.y };
              cp2 = cp1;
            }
          } else {
            cp1 = { x: newstart.x, y: newend.y };
            //cp2={x:newend.x, y:newstart.y};
            cp2 = cp1;
          }
        }
        if (etype === 'b') {
          newend = { x: end.x, y: end.y + offset };
          if (start.y < end.y) {
            //newstart={x:start.x+offset, y:start.y};
            cp2 = { x: newstart.x, y: newend.y };
            cp1 = { x: newend.x, y: newstart.y };
            //cp2=cp1;
          } else {
            if (start.x < end.x) {
              cp1 = { x: newstart.x, y: newend.y };
              //cp2={x:newend.x, y:newstart.y};
              cp2 = cp1;
            } else {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          }
        }
      }
      if (stype == 'b') {
        newstart = { x: start.x, y: start.y + offset };
        if (etype === 'r') {
          newend = { x: end.x + offset, y: end.y };
          if (start.x < end.x) {
            if (start.y < end.y) {
              cp1 = { x: newstart.x, y: newend.y };
              //cp2={x:newend.x, y:newstart.y};
              cp2 = cp1;
            } else {
              //cp1={x:newstart.x, y:newend.y};
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          } else {
            if (start.y < end.y) {
              //cp1={x:newstart.x, y:newend.y};
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            } else {
              //newstart={x:start.x+offset, y:start.y};
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          }
        }
        if (etype === 'l') {
          //newend={x:end.x-offset, y:end.y};
          if (start.x < end.x) {
            if (start.y < end.y) {
              cp1 = { x: newstart.x, y: newend.y };
              //cp2={x:newend.x, y:newstart.y};
              cp2 = cp1;
            } else {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          } else {
            if (start.y < end.y) {
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = { x: newend.x, y: newstart.y };
            } else {
              //cp1={x:newstart.x, y:newend.y};
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          }
        }
        if (etype === 'u') {
          newend = { x: end.x, y: end.y - offset };
          if (start.y < end.y) {
            if (start.x < end.x) {
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = { x: newend.x, y: newstart.y };
            } else {
              cp1 = { x: newstart.x, y: newend.y };
              cp2 = { x: newend.x, y: newstart.y };

            }
          } else {
            cp2 = { x: newstart.x, y: newend.y };
            cp1 = { x: newend.x, y: newstart.y };

          }
        }
        if (etype === 'b') {
          newend = { x: end.x, y: end.y + offset };
          if (start.y < end.y) {
            //newstart={x:start.x+offset, y:start.y};
            cp2 = { x: newstart.x, y: newend.y };
            //cp1={x:newend.x, y:newstart.y};
            cp1 = cp2;
          } else {
            if (start.x < end.x) {
              //cp1 = { x: newstart.x, y: newend.y };
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            } else {
              cp2 = { x: newend.x, y: newstart.y };
              cp1 = cp2;
            }
          }
        }
      }
    }
    fPoints = {
      pre: start,
      start: newstart,
      cp1: cp1,
      cp2: cp2,
      end: newend,
      post: end
    };

    this.drawBZSegments(ctx, fPoints);

    //subtype?
    if (this.tips === 'start' || this.tips === 'both')
      this.drawArrowTip(ctx, start, startAngle);
    if (this.tips === 'end' || this.tips === 'both')
      this.drawArrowTip(ctx, end, endAngle);
  }
  drawBZSegments(ctx, fPoints) {
    ctx.beginPath();
    ctx.moveTo(fPoints.pre.x, fPoints.pre.y);
    ctx.lineTo(fPoints.start.x, fPoints.start.y);

    ctx.moveTo(fPoints.start.x, fPoints.start.y);
    ctx.bezierCurveTo(
      fPoints.cp1.x,
      fPoints.cp1.y,
      fPoints.cp2.x,
      fPoints.cp2.y,
      fPoints.end.x,
      fPoints.end.y
    );

    ctx.moveTo(fPoints.post.x, fPoints.post.y);
    ctx.lineTo(fPoints.end.x, fPoints.end.y);
    ctx.strokeStyle = this.stroke;

    ctx.stroke();
  }
  drawBody(ctx, p, offset, stype, etype, connStartObj, connEndObj) {
    const { x1, x2, y1, y2 } = p;
    let { x11, x22, y11, y22 } = p;
    const zoom = this.canvas.getZoom();

    switch (stype) {
      case 'b':
        x11 = x1;
        y11 = y1 + offset;
        break;
      case 'u':
        x11 = x1;
        y11 = y1 - offset;
        break;
      case 'r':
        x11 = x1 + offset;
        y11 = y1;
        break;
      case 'l':
        x11 = x1 - offset;
        y11 = y1;
        break;
      default:
        x11 = x1;
        y11 = y1;
    }
    switch (etype) {
      case 'b':
        x22 = x2;
        y22 = y2 + offset;
        break;
      case 'u':
        x22 = x2;
        y22 = y2 - offset;
        break;
      case 'r':
        x22 = x2 + offset;
        y22 = y2;
        break;
      case 'l':
        x22 = x2 - offset;
        y22 = y2;
        break;
      default:
        x22 = x2;
        y22 = y2;
    }

    let m1, m2;
    let ms = { x: x11, y: y11 };
    const me = { x: x22, y: y22 };
    let keyPoints = [];
    const margin = 4;
    let yAdjustment;
    m1 = { x: (x11 + x22) / 2, y: y11 };
    m2 = { x: (x11 + x22) / 2, y: y22 };
    keyPoints = [ms, m1, m2, me];
    if (stype === 'f' && etype !== 'f') {
      yAdjustment = connEndObj.height * connEndObj.scaleY;
      let met;
      if (etype === 'r') {
        met = { x: me.x - offset, y: me.y };
        if (x1 < x2) {
          const msa = { x: ms.x + offset, y: ms.y };
          const midy =
            y1 < y2
              ? -yAdjustment - margin * zoom
              : yAdjustment + margin * zoom;
          m1 = { x: msa.x, y: y22 + midy };
          m2 = { x: x22, y: m1.y };
          keyPoints = [ms, msa, m1, m2, me];
        } //otherwise, default behavior
        keyPoints.push(met);
      } else if (etype === 'l') {
        met = { x: me.x + offset, y: me.y };
        if (x1 > x2) {
          ms = { x: x11, y: y11 };
          const msa = { x: ms.x - offset, y: ms.y };
          const midy =
            y1 < y2
              ? -yAdjustment - margin * zoom
              : yAdjustment + margin * zoom;
          m1 = { x: msa.x, y: y22 + midy };
          m2 = { x: x22, y: m1.y };
          keyPoints = [ms, msa, m1, m2, me];
        }
        keyPoints.push(met);
      } else if (etype === 'u') {
        met = { x: me.x, y: me.y + offset };
        keyPoints.push(met);
      } else if (etype === 'b') {
        met = { x: me.x, y: me.y - offset };
        keyPoints.push(met);
      }
    } else if (stype !== 'f' && etype === 'f') {
      if (!connStartObj) {
        yAdjustment = 10;
      } else {
        yAdjustment = connStartObj.height * connStartObj.scaleY;
      }
      const midy =
        y1 < y2 ? -yAdjustment - margin * zoom : yAdjustment + margin * zoom;
      let mst;
      if (stype === 'l') {
        mst = { x: ms.x + offset, y: ms.y };
        if (x1 < x2) {
          const msa = { x: me.x - offset, y: me.y };
          m1 = { x: ms.x, y: ms.y + midy };
          m2 = { x: msa.x, y: m1.y };
          keyPoints = [ms, m1, m2, msa, me];
        }
        keyPoints.unshift(mst);
      } else if (stype === 'r') {
        mst = { x: ms.x - offset, y: ms.y };
        if (x1 > x2) {
          const msa = { x: me.x + offset, y: me.y };
          m1 = { x: ms.x, y: ms.y + midy };
          m2 = { x: msa.x, y: m1.y };
          keyPoints = [ms, m1, m2, msa, me];
        }
        keyPoints.unshift(mst);
      } else if (stype === 'u') {
        mst = { x: ms.x, y: ms.y + offset };
        keyPoints.unshift(mst);
      } else if (stype === 'b') {
        mst = { x: ms.x, y: ms.y - offset };
        keyPoints.unshift(mst);
      }
    } else if (stype !== 'f' && etype !== 'f') {
      yAdjustment = connEndObj.height * connEndObj.scaleY;
      const midy =
        y1 < y2 ? -yAdjustment - margin * zoom : yAdjustment + margin * zoom;
      if (stype == 'r' && etype === 'l') {
        const mst = { x: ms.x - offset, y: ms.y };
        const met = { x: me.x + offset, y: me.y };
        if (x1 > x2) {
          m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'l' && etype === 'r') {
        const mst = { x: ms.x + offset, y: ms.y };
        const met = { x: me.x - offset, y: me.y };
        if (x1 < x2) {
          m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'r' && etype === 'r') {
        const mst = { x: ms.x - offset, y: ms.y };
        const met = { x: me.x - offset, y: me.y };
        if (x1 < x2) {
          m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        } else {
          m1 = { x: ms.x, y: me.y };
          keyPoints = [mst, ms, m1, me, met];
        }
      } else if (stype === 'l' && etype === 'l') {
        const mst = { x: ms.x + offset, y: ms.y };
        const met = { x: me.x + offset, y: me.y };
        if (x1 < x2) {
          m1 = { x: ms.x, y: me.y };
          keyPoints = [mst, ms, m1, me, met];
        } else {
          m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        }
      } else if (stype === 'u' && etype === 'l') {
        const mst = { x: ms.x, y: ms.y + offset };
        const met = { x: me.x + offset, y: me.y };
        if (x1 > x2) {
          if (y1 > y2) {
            m1 = { x: ms.x, y: me.y - midy };
            m2 = { x: me.x, y: m1.y };
            keyPoints = [mst, ms, m1, m2, me, met];
          } else {
            m1 = { x: me.x, y: ms.y };
            keyPoints = [mst, ms, m1, me, met];
          }
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'u' && etype === 'r') {
        const mst = { x: ms.x, y: ms.y + offset };
        const met = { x: me.x - offset, y: me.y };
        if (x1 < x2) {
          if (y1 > y2) {
            m1 = { x: ms.x, y: me.y - yAdjustment };
            m2 = { x: me.x, y: m1.y };
            keyPoints = [mst, ms, m1, m2, me, met];
          } else {
            m1 = { x: me.x, y: ms.y };
            keyPoints = [mst, ms, m1, me, met];
          }
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'b' && etype === 'l') {
        const mst = { x: ms.x, y: ms.y - offset };
        const met = { x: me.x + offset, y: me.y };
        if (x1 > x2) {
          m1 = { x: me.x, y: ms.y };
          keyPoints = [mst, ms, m1, me, met];
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'b' && etype === 'r') {
        const mst = { x: ms.x, y: ms.y - offset };
        const met = { x: me.x - offset, y: me.y };
        if (x1 < x2) {
          m1 = { x: me.x, y: ms.y };
          keyPoints = [mst, ms, m1, me, met];
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'r' && etype === 'u') {
        const mst = { x: ms.x - offset, y: ms.y };
        const met = { x: me.x, y: me.y + offset };
        if (x1 > x2) {
          if (y1 > y2)
            m1 = { x: ms.x, y: me.y - midy };
          else
            m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];

        } else {
          if (y1 > y2)
            keyPoints = [mst, ms, m1, m2, me, met];
          else {
            m1 = { x: me.x, y: ms.y };
            keyPoints = [mst, ms, m1, me, met];
          }
        }
      } else if (stype === 'l' && etype === 'u') {
        const mst = { x: ms.x + offset, y: ms.y };
        const met = { x: me.x, y: me.y + offset };
        if (x1 < x2) {
          m1 = { x: ms.x, y: me.y - yAdjustment };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        } else {
          if (y1 < y2) {
            m1 = { x: me.x, y: ms.y };
            keyPoints = [mst, ms, m1, me, met];
          }
          else
            keyPoints = [mst, ms, m1, m2, me, met];
        }
      } else if (stype === 'l' && etype === 'b') {
        const mst = { x: ms.x + offset, y: ms.y };
        const met = { x: me.x, y: me.y - offset };
        if (x1 < x2) {
          if (y1 < y2) m1 = { x: ms.x, y: me.y - midy };
          else m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else if (stype === 'r' && etype === 'b') {
        const mst = { x: ms.x - offset, y: ms.y };
        const met = { x: me.x, y: me.y - offset };
        if (x1 > x2) {
          if (y1 < y2) m1 = { x: ms.x, y: me.y - midy };
          else m1 = { x: ms.x, y: me.y + midy };
          m2 = { x: me.x, y: m1.y };
          keyPoints = [mst, ms, m1, m2, me, met];
        } else keyPoints = [mst, ms, m1, m2, me, met];
      } else {
        let mst, met;
        if (stype === 'u') mst = { x: ms.x, y: ms.y + offset };
        else mst = { x: ms.x, y: ms.y - offset };

        if (etype === 'u') met = { x: me.x, y: me.y + offset };
        else met = { x: me.x, y: me.y - offset };
        keyPoints = [mst, ms, m1, m2, me, met];
      }
    }
    this.drawSegments(ctx, keyPoints);
  }

  drawSegments(ctx, keyPoints) {
    for (let i = 0; i < keyPoints.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(keyPoints[i].x, keyPoints[i].y);
      ctx.lineTo(keyPoints[i + 1].x, keyPoints[i + 1].y);
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
    }
  }
  drawArrowTip(ctx, p, fixAngle = -1) {
    const radians = Math.PI / 180;
    const angle = fixAngle;
    const tipAngle = 22.5;
    const currZoom = this.canvas.getZoom();
    const len =
      currZoom > 1.0
        ? (12 + this.strokeWidth * 2) / currZoom
        : 12 + this.strokeWidth * 2;
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.stroke;
    {
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x + len * Math.sin((180 - angle - tipAngle) * radians),
        p.y + len * Math.cos((180 - angle - tipAngle) * radians)
      );
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x + len * Math.sin((180 - angle + tipAngle) * radians),
        p.y + len * Math.cos((180 - angle + tipAngle) * radians)
      );
    }
    ctx.stroke();
  }
  drawArrowTips(ctx, p, fixAngle) {
    const radians = Math.PI / 180;
    const angle = fixAngle || this.getArrowAngle();
    const tipAngle = 22.5;
    const currZoom = this.canvas.getZoom();
    const len =
      currZoom > 1.0
        ? (12 + this.strokeWidth * 2) / currZoom
        : 12 + this.strokeWidth * 2;
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.stroke;
    if (this.tips === 'end' || this.tips === 'both') {
      ctx.moveTo(p.x2, p.y2);
      ctx.lineTo(
        p.x2 - len * Math.sin((180 - angle - tipAngle) * radians),
        p.y2 - len * Math.cos((180 - angle - tipAngle) * radians)
      );
      ctx.moveTo(p.x2, p.y2);
      ctx.lineTo(
        p.x2 - len * Math.sin((180 - angle + tipAngle) * radians),
        p.y2 - len * Math.cos((180 - angle + tipAngle) * radians)
      );
    }
    if (this.tips === 'start' || this.tips === 'both') {
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(
        p.x1 + len * Math.sin((180 - angle - tipAngle) * radians),
        p.y1 + len * Math.cos((180 - angle - tipAngle) * radians)
      );
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(
        p.x1 + len * Math.sin((180 - angle + tipAngle) * radians),
        p.y1 + len * Math.cos((180 - angle + tipAngle) * radians)
      );
    }
    ctx.stroke();
  }
  setConnectorObj(targetObject, pointer, isInOneObj, isStart) {
    return;
  }

  positionProcess(fabricObject, isStart) {
    const offsetX = (fabricObject.x1 + fabricObject.x2) / 2;
    const offsetY = (fabricObject.y1 + fabricObject.y2) / 2;
    let x, y;
    if (isStart) {
      x = fabricObject.x1 - offsetX;
      y = fabricObject.y1 - offsetY;
    }
    if (!isStart) {
      x = fabricObject.x2 - offsetX;
      y = fabricObject.y2 - offsetY;
    }
    // recalculate control's coordinate by viewportTransform and line's transform matrix
    const matrix = multiplyTransformMatrices(
      this.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    );
    //@ts-ignore
    return transformPoint({ x, y }, matrix);
  }
  mousedownProcess(transformData, eventData, isStart) {
    console.log('mousedownProcess')
    return;
  }
  mouseupProcess(transformData, eventData, isStart) {
    const { target } = transformData;
    if (target.locked) return;

    this.canvas.arrowMxy = null;

    let oldConnStartObj;
    let oldConnEndObj;
    let connStartId;
    let connEndId;
    const pointer = this.canvas.getPointer(eventData);
    const targetObject = this.canvas.getTopObjectByPointer(pointer, true, true);
    if (target.connectorStart) {
      oldConnStartObj = this.canvas.findById(target.connectorStart._id);
      connStartId = target.connectorStart._id;
    }
    if (target.connectorEnd) {
      oldConnEndObj = this.canvas.findById(target.connectorEnd._id);
      connEndId = target.connectorEnd._id;
    }

    if (targetObject) {
      if (
        oldConnStartObj &&
        oldConnEndObj &&
        oldConnStartObj._id === oldConnEndObj._id
      ) {
        /* arrow inside one widget */
        target.setConnectorObj(targetObject, pointer, true, true);
      } else if (isStart) {
        if (!connStartId) {
          /* arrow start obj is empty, change the start connect to targetObject */
          target.setConnectorObj(targetObject, pointer, false, true);
        } else if (connStartId !== targetObject._id) {
          /* arrow start obj is not empty, modify the start connect to targetObject */
          target.setConnectorObj(targetObject, pointer, false, true);
        } else {
          /* arrow start obj is targetObject but position of start point changed */
          target.setConnectorObj(targetObject, pointer, false, true);
        }
        fromnull = false;
      } else {
        if (!connEndId) {
          /* arrow start obj is empty, change the start connect to targetObject */
          target.setConnectorObj(targetObject, pointer, false, false);
        } else if (connEndId !== targetObject._id) {
          /* arrow start obj is not empty, modify the start connect to targetObject */
          target.setConnectorObj(targetObject, pointer, false, false);
        } else {
          /* arrow start obj is targetObject but position of start point changed */
          target.setConnectorObj(targetObject, pointer, false, false);
        }
        tonull = false;
      }
    } else {
      /* move the arrow start circle to empty place */
      this.canvas.setActiveObject(target);
      if (
        oldConnStartObj &&
        oldConnEndObj &&
        oldConnStartObj._id === oldConnEndObj._id
      ) {
        target.removeArrowfromConnectObj(oldConnStartObj);
        target.connectorStart = null;
        target.connectorEnd = null;
        tonull = true;
        fromnull = true;
      } else if (oldConnStartObj && isStart) {
        target.removeArrowfromConnectObj(oldConnStartObj);
        target.connectorStart = null;
        fromnull = true;
      } else if (oldConnEndObj && !isStart) {
        target.removeArrowfromConnectObj(oldConnEndObj);
        target.connectorEnd = null;
        tonull = true;
      }
      if (isStart)
        target.set({
          x1: pointer.x,
          y1: pointer.y
        });
      if (!isStart)
        target.set({
          x2: pointer.x,
          y2: pointer.y
        });
    }
    oldConnStartObj = null;
    oldConnEndObj = null;
    target.setCoords();
    this.canvas.requestRenderAll();
    target.zIndex = Date.now() * 100;
    target.saveData('MODIFIED', [
      'left',
      'top',
      'x1',
      'y1',
      'x2',
      'y2',
      'connectorStart',
      'connectorEnd',
      'scaleX',
      'scaleY',
      'zIndex'
    ]);
  }
  calcDistanceToTarget(current, target: any) {
    const { left, top, width, height, scaleX, scaleY } = target;
    const range = 30;

    const ml = { x: left - (width * scaleX) / 2, y: top };
    const mr = { x: left + (width * scaleX) / 2, y: top };
    const mt = { x: left, y: top - (height * scaleY) / 2 };
    const mb = { x: left, y: top + (height * scaleY) / 2 };


    if (current.y > mt.y && current.y < mb.y) {
      if (current.x > ml.x && current.x < ml.x + range) {
        return {
          x: ml.x,
          y: ml.y,

          dot: 'mla'
        };
      }

      if (current.x > mr.x - range && current.x < mr.x) {
        return {
          x: mr.x,
          y: mr.y,

          dot: 'mra'
        };
      }
    }

    if (current.x > ml.x && current.x < mr.x) {
      if (current.y > mt.y && current.y < mt.y + range) {
        return {
          x: mt.x,
          y: mt.y,

          dot: 'mta'
        };
      }

      if (current.y > mb.y - range && current.y < mb.y) {
        return {
          x: mb.x,
          y: mb.y,

          dot: 'mba'
        };
      }
    }

    return {

      x: current.x - 5,
      y: current.y - 5,
      dot: 0
    };


  }
}

classRegistry.setClass(Arrow);
