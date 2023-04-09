<script setup>
import { ref } from "vue"
import Game from "./components/Game.vue"
const inputText = ref("")
const input = ref("")
const runGame = ref(false)
const fastOutput = ref(false)
const showInputPanel = ref(true)
const palceHolder = ref('输入不带空行的多个名字进行混战\n输入空行可以分队\n输入一个名字或在最前面输入单独一行\"!test!\"可以获得名字的详细信息')
function RunArena() {
  showInputPanel.value = false
  input.value = inputText.value
  runGame.value = true;
}
function SpeedUp() {
  fastOutput.value = true
}
function ShowPanel() {
  showInputPanel.value = true
}
</script>

<template>
  <Game :msg="input" :run="runGame" :fast="fastOutput" @response1="(state) => runGame = state" @response2="(state) => fastOutput = state"/>
  <div id="panels" class="panels">
    <div v-if="showInputPanel" id="inputPanel" class="panel vertical">
      <div id="inputTitle" class="paneltitle">输入框</div>
      <div id="textdiv">
        <textarea v-model="inputText" :placeholder="palceHolder"></textarea>
      </div>
      <div id="startBar" class="startbar">
        <button class="startbtn" @click="RunArena">开始</button>
      </div>
    </div>
    <div id="endPanel"></div>
  </div>
  <div id="controlBar" class="controlbar">
    <button id="fastBtn" class="micon" @click="SpeedUp">加速</button>
    <button id="refreshBtn" class="micon" @click="ShowPanel">重置</button>
  </div>
</template>

<style scoped>
div {
  box-sizing: border-box;
}
button {
  padding: 4px 8px;
}
.panels {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.panel {
  position: absolute;
  width: 320px;
  min-height: 320px;
  max-height: 480px;
  margin: auto;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: #000;
  padding: 8px;
  padding-top: 0;
  pointer-events: auto;
}
.panel > * {
  margin-top: 8px;
}
.vertical {
  display: flex;
  flex-direction: column;
}
.vertical >* {
  position: relative;
}
.paneltitle {
  color: #FFF;
  white-space: pre;
  text-align: center;
}
#textdiv {
  width:100%;
  height:320px;
  flex: 1 1 320px;
}
textarea {
  position: absolute;
  height: 100%;
  width: 304px;
  resize: none;
  box-sizing: border-box;
  border: none;
  padding: 5px;
}
.startbar {
  width: 100%;
  height: 30px;
}
.startbtn {
  position: absolute;
  width: 100px;
  left: 0;
  right: 0;
  margin: auto;
}
.controlbar {
  position: absolute;
  top: 0;
  right: 0;
}
.micon {
  width: 48px;
  height: 48px;
}
</style>