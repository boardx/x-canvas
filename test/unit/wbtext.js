(function () {

  QUnit.module('fabric.Text', {
    before() {
      fabric.config.configure({ NUM_FRACTION_DIGITS: 2 });
    },
    after() {
      fabric.config.restoreDefaults();
    }
  });

  function createTextObject(text) {
    return new fabric.Text(text || 'x');
  }

  var CHAR_WIDTH = 20;

  var REFERENCE_TEXT_OBJECT = {
    version: fabric.version,
    //type: 'Text',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: CHAR_WIDTH,
    height: 45.2,
    fill: 'rgb(0,0,0)',
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeDashOffset: 0,
    strokeLineJoin: 'miter',
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '',
    text: 'x',
    fontSize: 40,
    fontWeight: 'normal',
    fontFamily: 'Times New Roman',
    fontStyle: 'normal',
    lineHeight: 1.16,
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: 'left',
    textBackgroundColor: '',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    globalCompositeOperation: 'source-over',
    skewX: 0,
    skewY: 0,
    charSpacing: 0,
    styles: [],
    path: null,
    strokeUniform: false,
    direction: 'ltr',
    pathStartOffset: 0,
    pathSide: 'left',
    pathAlign: 'baseline',
    obj_type: 'WBText'
  };

  QUnit.test('constructor', function (assert) {
    assert.ok(fabric.Text);
    var text = createTextObject();

    assert.ok(text);
    assert.ok(text instanceof fabric.Text);
    assert.ok(text instanceof fabric.Object);

    assert.equal(text.constructor.name, 'Text');
    assert.equal(text.get('text'), 'x');
  });

  QUnit.test('toString', function (assert) {
    var text = createTextObject();
    assert.ok(typeof text.toString === 'function');
    assert.equal(text.toString(), '#<Text (1): { "text": "x", "fontFamily": "Times New Roman" }>');
  });

  QUnit.test('toObject', function (assert) {
    var text = createTextObject();
    assert.ok(typeof text.toObject === 'function');
    assert.deepEqual(text.toObject(), REFERENCE_TEXT_OBJECT);
  });

})();
