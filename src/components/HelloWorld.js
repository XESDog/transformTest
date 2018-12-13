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

function createBall(radius, color) {
    let ball = new PIXI.Graphics();
    ball.beginFill(color);
    ball.drawCircle(0, 0, radius);
    ball.endFill();
    return ball;
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
            selectBound: new PIXI.Bounds(),//选中对象的bound
            moveTarget: null,//鼠标移动的对象
            pivot: new PIXI.Point(0, 0),//控制器-旋转点相对舞台的位置
            // register: new PIXI.Point(0, 0),//注册点

            matrix: new PIXI.Matrix(),//控制器-matrix
            startMatrix: new PIXI.Matrix(),//鼠标按下时，记录此时的变形矩阵
            startP: new PIXI.Point(),//鼠标点
        }
    },
    computed: {
        controllerStyle: function () {
            let transform = '';
            let boundX = 0;
            let boundY = 0;
            if (this.matrix) {
                transform = `matrix(${this.matrix.a},${this.matrix.b},${this.matrix.c},${this.matrix.d},${this.matrix.tx},${this.matrix.ty})`
            }
            if (this.selectBound) {
                boundX = this.selectBound.x;
                boundY = this.selectBound.y;
            }
            return {
                transform: transform,
                width: `${this.selectBound ? this.selectBound.width : 0}px`,
                height: `${this.selectBound ? this.selectBound.height : 0}px`,
                border: `1px solid greenyellow`,
                position: `absolute`,
                left: `${boundX}px`,
                top: `${boundY}px`,
                'transform-origin': `${-1 * boundX}px ${-1 * boundY}px`,
            }
        },
        selectState: function () {
            return this.selectTargets.length;
        }
    },
    name: 'HelloWorld',
    methods: {
        getSelectTargetsLocalBound() {
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
            let target = this.selectTargets[0];
            let localMatrix = target.localMatrix;
            let worldMatrix = target.worldMatrix;
            let oldPosition = target.position;
            let oldRotation = target.rotation;
            let oldScale = target.scale;
            let oldPivot = target.pivot;

            if (this.moveTarget === 'scale') {
                ep = worldMatrix.applyInverse(ep);
                sp = worldMatrix.applyInverse(sp)
                oldPosition = localMatrix.applyInverse(oldPosition)

                ep.x -= oldPosition.x;
                ep.y -= oldPosition.y;
                sp.x -= oldPosition.x;
                sp.y -= oldPosition.y;


                let newScale = {x: oldScale.x * ep.x / sp.x, y: oldScale.y * ep.y / sp.y};
                target.object.scale = newScale;

            } else if (this.moveTarget === 'rotation') {

                ep = localMatrix.apply(worldMatrix.applyInverse(ep));
                sp = localMatrix.apply(worldMatrix.applyInverse(sp));

                ep.x -= oldPosition.x;
                ep.y -= oldPosition.y;
                sp.x -= oldPosition.x;
                sp.y -= oldPosition.y;

                let newRotation = Math.atan2(ep.y, ep.x) - Math.atan2(sp.y, sp.x) + oldRotation;
                target.object.rotation = newRotation

            } else if (this.moveTarget === 'pivot') {

                this.pivot.x = ep.x;
                this.pivot.y = ep.y;

                //拖动到相对原始空间的位置
                ep = worldMatrix.applyInverse(ep);

                let newPivot = {x: ep.x, y: ep.y};

                //折算回target的父级空间，用以操作position
                let offsetPosition = localMatrix.apply(newPivot);
                oldPivot = localMatrix.apply(oldPivot);
                let newPosition = {
                    x: oldPosition.x + offsetPosition.x - oldPivot.x,
                    y: oldPosition.y + offsetPosition.y - oldPivot.y
                };
                target.object.pivot = newPivot;
                target.object.position = newPosition;
            }
        },
        mouseDown(type, e) {
            this.moveTarget = type;
            this.startMatrix = this.matrix.clone();
            this.startP = new PIXI.Point(e.clientX, e.clientY);

            this.selectTargets.map(value => {
                value.localMatrix = value.object.transform.localTransform.clone();
                value.worldMatrix = value.object.transform.worldTransform.clone();
                value.position = value.object.position.clone();
                value.scale = value.object.scale.clone();
                value.pivot = value.object.pivot.clone();
                value.rotation = value.object.rotation;
            })

        },
        mouseUp() {
            this.moveTarget = null;
        },
    },
    mounted() {

        document.onmousemove = this.mouseMove;

        this.app = new PIXI.Application({view: this.$el.getElementsByTagName('canvas')[0]})
        this.rect.beginFill(0xff0000);
        this.rect.drawRect(-40, -40, 100, 100);
        this.rect.endFill();
        this.rect.beginFill(0xffffff);
        this.rect.drawRect(-2, -2, 4, 4);
        this.rect.endFill();

        this.rect.x = this.rect.y = 200;
        this.rect.rotation = 30 * Math.PI / 180;
        this.rect.scale.set(1.5, 1.2);

        this.circle.beginFill(0xff0000);
        this.circle.drawCircle(-10, -10, 50);
        this.circle.endFill();
        this.circle.beginFill(0xffffff);
        this.circle.drawRect(-2, -2, 4, 4);
        this.circle.endFill();
        this.circle.rotation = 15 * Math.PI / 180;
        this.circle.x = -30;
        this.circle.y = -30;

        this.container.x = 200;
        this.container.y = 200;
        this.container.rotation = 15 * Math.PI / 180;
        this.container.scale.set(1.1, 1.2);


        this.app.stage.addChild(this.container);
        this.container.addChild(this.rect);
        this.container.addChild(this.circle);

        this.selectTargets.push({object: this.circle});
        // this.selectTargets.push({object: this.rect});
        // this.selectTargets.push({object: this.container});

        //更新控制器的pivot位置
        this.app.renderer.on('postrender', () => {
            if (this.selectState > 0) {
                let firstTarget = this.selectTargets[0].object;
                if (this.selectState === 1) {
                    this.matrix = firstTarget.transform.worldTransform;
                    this.pivot = firstTarget.toGlobal(EMPTY_POINT);
                } else {
                    this.matrix = firstTarget.parent.transform.worldTransform;
                    this.pivot = firstTarget.parent.toGlobal(EMPTY_POINT);
                }
            }

            this.selectBound = this.getSelectTargetsLocalBound();

            this.app.renderer.removeListener('postrender');
        })


    }
}