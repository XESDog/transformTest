import * as PIXI from 'pixi.js'

/**
 * 将Rectangle转换成Bounds
 * @param rect
 * @return {PIXI.Bounds}
 */
function toBounds(rect) {
    let bounds = new PIXI.Bounds();
    bounds.minX = rect.x;
    bounds.maxX = rect.x + rect.width;
    bounds.minY = rect.y;
    bounds.maxY = rect.y + rect.height;
    return bounds;
}

function transferBounds(matrix, bounds) {
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;
    const tx = matrix.tx;
    const ty = matrix.ty;

    let bound = new PIXI.Bounds();

    let minX = bound.minX;
    let minY = bound.minY;
    let maxX = bound.maxX;
    let maxY = bound.maxY;

    let x = (a * bounds.minX) + (c * bounds.minY) + tx;
    let y = (b * bounds.minX) + (d * bounds.minY) + ty;

    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = (a * bounds.maxX) + (c * bounds.minY) + tx;
    y = (b * bounds.maxX) + (d * bounds.minY) + ty;
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = (a * bounds.minX) + (c * bounds.maxY) + tx;
    y = (b * bounds.minX) + (d * bounds.maxY) + ty;
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = (a * bounds.maxX) + (c * bounds.maxY) + tx;
    y = (b * bounds.maxX) + (d * bounds.maxY) + ty;
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    bound.minX = minX;
    bound.minY = minY;
    bound.maxX = maxX;
    bound.maxY = maxY;
    return bound;
}

const EMPTY_POINT = new PIXI.Point();

export default {
    data() {
        return {
            app: null,
            container: new PIXI.Container(),
            rect: new PIXI.Graphics(),
            circle: new PIXI.Graphics(),

            selectTargets: [],//选中的对象
            selectRect: new PIXI.Rectangle(),//选中对象的rect
            selectBounds: null,//选中对象的bound
            transferRectPoints: [],//选中对象变形之后的rect

            moveTarget: null,//鼠标移动的对象
            selectPivot: new PIXI.Point(0, 0),//控制器-旋转点相对舞台的位置
            parentMatrix: new PIXI.Matrix(),
            startControlMatrix: new PIXI.Matrix(),//选择对象后，被选中对象组成的matrix，多选为标准matrix
            controlMatrix: new PIXI.Matrix(),//操作过程中，控制器的matrix
            startP: new PIXI.Point(),//鼠标点
        }
    },
    computed: {
        polyLinePoints: function () {
            let str = '';
            this.transferRectPoints.forEach(value => {
                str += `${value.x} ${value.y} `
            });
            return str;
        },
        controllerStyle: function () {

            let rect = this.selectRect;
            let bound = toBounds(rect);

            let matrix = this.parentMatrix.clone().append(this.controlMatrix);
            this.selectBounds = transferBounds(matrix, bound);
            this.transferRectPoints = [
                matrix.apply({
                    x: bound.minX,
                    y: bound.minY
                }),
                matrix.apply({
                    x: bound.minX,
                    y: bound.maxY
                }),
                matrix.apply({
                    x: bound.maxX,
                    y: bound.maxY
                }),
                matrix.apply({
                    x: bound.maxX,
                    y: bound.minY
                }),
                matrix.apply({
                    x: bound.minX,
                    y: bound.minY
                })
            ];

            return {
                width: `${this.selectBounds ? this.selectBounds.maxX : 0}px`,
                height: `${this.selectBounds ? this.selectBounds.maxY : 0}px`,
                position: `absolute`,
                left: `0px`,
                top: `0px`,
            }
        },
        selectState: function () {
            return this.selectTargets.length;
        }
    },
    name: 'HelloWorld',
    methods: {
        getSelectTargetsLocalBounds() {
            let bound = null, otherBound = null;
            if (this.selectState < 1) return null;
            //单个元素，worldTransform*bound 就能够正确显示
            if (this.selectState === 1) {
                bound = this.selectTargets[0].object.getLocalBounds();
            }
            //多个元素，需要获取每个元素在父容器中的位置，然后叠加上父容器的worldTransform
            if (this.selectState > 1) {
                this.selectTargets.forEach((value, index) => {
                    value = value.object;
                    if (index === 0) {
                        bound = value.getLocalBounds();
                        bound = toBounds(bound);
                        bound = transferBounds(value.transform.localTransform, bound);
                    } else {
                        otherBound = value.getLocalBounds();
                        otherBound = toBounds(otherBound);
                        otherBound = transferBounds(value.transform.localTransform, otherBound);
                        bound.addBounds(otherBound);
                    }
                });
                bound = bound.getRectangle();
            }
            return bound;
        },
        mouseMove(e) {
            if (!this.moveTarget) return;

            let sp = this.startP.clone();
            let ep = new PIXI.Point(e.clientX, e.clientY);

            if (this.moveTarget === 'scale') {
                this.selectTargets.map(value => {
                    let transform = this.getScaleTransform(this.parentMatrix, value.localMatrix, this.selectPivot, sp, ep);
                    this.setTransform(value.object, transform);

                    let controlTransform = this.getScaleTransform(this.parentMatrix, this.startControlMatrix, this.selectPivot, sp, ep)
                    controlTransform.updateLocalTransform();
                    this.controlMatrix = controlTransform.localTransform
                });

            } else if (this.moveTarget === 'rotation') {

                this.selectTargets.map(value => {
                    let transform = this.getRotationTransform(this.parentMatrix, value.localMatrix, this.selectPivot, sp, ep);
                    this.setTransform(value.object, transform);

                    let controlTransform = this.getRotationTransform(this.parentMatrix, this.startControlMatrix, this.selectPivot, sp, ep)
                    controlTransform.updateLocalTransform();
                    this.controlMatrix = controlTransform.localTransform
                });

            } else if (this.moveTarget === 'pivot') {

                this.selectPivot.x = ep.x;
                this.selectPivot.y = ep.y;
            }
        },
        setTransform(target, transform) {
            target.scale = transform.scale.clone();
            target.position = transform.position.clone();
            target.skew = transform.skew.clone();
            target.rotation = transform.rotation;
            target.pivot = transform.pivot.clone();
        },
        getScaleTransform(parentMatrix, originMatrix, pivotInWorld, spInWorld, epInWorld) {
            let transform = originMatrix.decompose(new PIXI.Transform());
            let scale = transform.scale;
            let position = transform.position;
            let worldMatrix = parentMatrix.clone().append(originMatrix.clone());

            //折算到显示对象内部空间
            let spInLocal = worldMatrix.applyInverse(spInWorld);
            let enInLocal = worldMatrix.applyInverse(epInWorld);
            let pivotInLocal = worldMatrix.applyInverse(pivotInWorld);

            //减去pivot值
            spInLocal.x -= pivotInLocal.x;
            spInLocal.y -= pivotInLocal.y;
            enInLocal.x -= pivotInLocal.x;
            enInLocal.y -= pivotInLocal.y;

            let newScale = new PIXI.Point(scale.x * enInLocal.x / spInLocal.x, scale.y * enInLocal.y / spInLocal.y);
            transform.scale = newScale;

            let offsetPositionInLocal = {
                x: -pivotInLocal.x * newScale.x / scale.x,
                y: -pivotInLocal.y * newScale.y / scale.y
            };
            //折算到父坐标空间，计算出在父坐标空间中注册点相对于pivot的偏移量
            let offsetPositionInParent = originMatrix.apply(offsetPositionInLocal);
            offsetPositionInParent.x -= position.x;
            offsetPositionInParent.y -= position.y;

            let pivotInParent = originMatrix.apply(pivotInLocal);

            //偏移量+pivot等于新的position
            transform.position.x = offsetPositionInParent.x + pivotInParent.x;
            transform.position.y = offsetPositionInParent.y + pivotInParent.y;

            return transform;
        },
        getRotationTransform(parentMatrix, originMatrix, pivotInWorld, spInWorld, epInWorld) {
            let transform = originMatrix.decompose(new PIXI.Transform());
            let rotation = transform.rotation;
            let position = transform.position;

            //折算到显示对象父级空间
            let spInParent = parentMatrix.applyInverse(spInWorld);
            let epInParent = parentMatrix.applyInverse(epInWorld);
            let pivotInParent = parentMatrix.applyInverse(pivotInWorld);

            //减去父级空间对象的起始坐标
            let offsetSp = {x: spInParent.x - pivotInParent.x, y: spInParent.y - pivotInParent.y}
            let offsetEP = {x: epInParent.x - pivotInParent.x, y: epInParent.y - pivotInParent.y}
            let offsetRotation = Math.atan2(offsetEP.y, offsetEP.x) - Math.atan2(offsetSp.y, offsetSp.x)
            transform.rotation = offsetRotation + rotation;

            let matrix = new PIXI.Matrix();
            matrix.setTransform(0, 0, 0, 0, 1, 1, offsetRotation, 0, 0);
            let offsetPosition = matrix.apply({x: position.x - pivotInParent.x, y: position.y - pivotInParent.y});

            transform.position.x = offsetPosition.x + pivotInParent.x;
            transform.position.y = offsetPosition.y + pivotInParent.y;

            return transform;
        },
        changePivot(sp, ep) {
            this.selectPivot = ep;
        },
        mouseDown(type, e) {
            this.moveTarget = type;
            this.startP = new PIXI.Point(e.clientX, e.clientY);

            this.initControlInfo();
        },
        mouseUp() {
            this.moveTarget = null;
        },
        initControlInfo() {
            if (this.selectState > 0) {
                let firstTarget = this.selectTargets[0].object;
                this.parentMatrix = firstTarget.parent.transform.worldTransform.clone();

                if (this.selectState === 1) {
                    this.startControlMatrix = firstTarget.transform.localTransform.clone();
                    this.controlMatrix = firstTarget.transform.localTransform.clone();
                } else {
                    //默认
                }
            }
            this.selectTargets.map(value => {
                value.localMatrix = value.object.transform.localTransform.clone();
                value.position = value.object.position.clone();
                value.scale = value.object.scale.clone();
                value.selectPivot = value.object.pivot.clone();
                value.rotation = value.object.rotation;
            });

            this.selectRect = this.getSelectTargetsLocalBounds();
        },
    },
    mounted() {

        document.onmousemove = this.mouseMove;

        this.app = new PIXI.Application({view: this.$el.getElementsByTagName('canvas')[0]})
        this.rect.beginFill(0xff0000);
        this.rect.drawRect(0, 0, 100, 100);
        this.rect.endFill();

        this.rect.x = this.rect.y = 200;
        this.rect.rotation = 30 * Math.PI / 180;
        this.rect.scale.set(1.5, 1.2);

        this.circle.beginFill(0xff0000);
        // this.circle.drawCircle(0, 0, 50);
        this.circle.drawCircle(50, 50, 50);
        this.circle.endFill();
        this.circle.rotation = 15 * Math.PI / 180;
        this.circle.x = -30;
        this.circle.y = -30;

        this.container.x = 200;
        this.container.y = 200;
        this.container.pivot.set(100,100)
        this.container.rotation = 15 * Math.PI / 180;
        this.container.scale.set(1.1, 1.2);


        this.app.stage.addChild(this.container);
        this.container.addChild(this.rect);
        this.container.addChild(this.circle);

        this.selectTargets.push({object: this.circle});
        this.selectTargets.push({object: this.rect});
        // this.selectTargets.push({object: this.container});

        //初始化选框
        this.app.renderer.on('postrender', () => {
            this.initControlInfo();

            this.selectPivot.x = this.parentMatrix.tx;
            this.selectPivot.y = this.parentMatrix.ty;

            this.app.renderer.removeListener('postrender');
        })


    }
}