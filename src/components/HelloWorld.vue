<template>
    <div v-on:mouseup="mouseUp">
        <canvas></canvas>
        <div class="controller"
             v-bind:style="controllerStyle">
            <div v-on:mousedown="mouseDown('scale',$event)"
                 class="scalePoint"></div>
            <div v-on:mousedown="mouseDown('rotation',$event)"
                 class="rotationPoint"></div>
        </div>
        <!--<div v-bind:style="registerPointerStyle"-->
             <!--class="registerPoint" :style="{left:register.x+'px',top:register.y+'px'}"></div>-->
        <div v-on:mousedown="mouseDown('pivot',$event)"
             class="pivotPoint" :style="{left:pivot.x+'px',top:pivot.y+'px'}"></div>
        <div>select bound:{{selectBound}}</div>
        <!--<div>register:{{register}}</div>-->
        <div>pivot:{{pivot}}</div>
        <div>controller matrix:{{matrix}}</div>
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
        right: 0px;
        bottom: 0px;
        width: 10px;
        height: 10px;
        background-color: blue;
    }

    .rotationPoint {
        border: 1px solid black;
        border-radius: 10px;
        position: absolute;
        right: -10px;
        bottom: -10px;
        width: 10px;
        height: 10px;
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

    .registerPoint {
        width: 10px;
        height:10px;
        border: 1px solid white;
        position: absolute;
        transform: translate(-50%, -50%)
    }
</style>
