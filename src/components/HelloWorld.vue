<template>
    <div v-on:mouseup="mouseUp">
        <canvas></canvas>
        <div v-bind:style="controllerStyle">
            <svg v-bind:viewBox="'0 0 '+(selectBound.maxX)+' '+(selectBound.maxY)"
                 style="position: absolute">
                <polyline :points="polyLinePoints" fill="none" stroke="white"></polyline>
            </svg>
        </div>
        <div v-on:mousedown="mouseDown('rotation',$event)"
             :style="{left:transferRectPoints[2].x+'px',
                 top:transferRectPoints[2].y+'px',
                 transform:'translate(-50% ,-50%)'
                 }"
             class="rotationPoint"></div>
        <div v-on:mousedown="mouseDown('scale',$event)"
             :style="{left:transferRectPoints[2].x+'px',
                 top:transferRectPoints[2].y+'px',
                 transform:'translate(-50% ,-50%)'
                 }"
             class="scalePoint"></div>
        <div v-on:mousedown="mouseDown('pivot',$event)"
             class="pivotPoint" :style="{left:selectPivot.x+'px',top:selectPivot.y+'px'}"></div>
        <div>select rect:{{selectRect}}</div>
        <div>parent matrix:{{parentMatrix}}</div>
        <div>controller matrix:{{controlMatrix}}</div>
        <div>start controller matrix:{{startControlMatrix}}</div>
    </div>
</template>

<script>
    import HelloWorld from './HelloWorld.js'

    export default HelloWorld;
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .scalePoint {
        border: 1px solid black;
        position: absolute;
        border-radius: 5px;
        width: 5px;
        height: 5px;
        background-color: blue;
    }

    .rotationPoint {
        border: 1px solid black;
        border-radius: 20px;
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: greenyellow;
    }

    .pivotPoint {
        border: 1px solid white;
        border-radius: 10px;
        position: absolute;
        width: 10px;
        height: 10px;
        transform: translate(-50%, -50%);
    }
</style>
