<script setup>
import Arena from "./Arena.vue"
import { onMounted, computed, ref, watch } from "vue"
const props = defineProps({
    msg: String,
    run: Boolean,
    fast: Boolean
})
const emit = defineEmits(['response1', 'response2'])
const runRequest = computed(() => {return props.run})
const speedRequest = computed(() => {return props.fast})
const players = ref("")
const running = ref(false)
const iframedom = ref(null)
let gameId = 0
watch(runRequest, (newRequest) => {
  if (newRequest) {
    RunGame(props.msg)
    emit("response1", false)
    running.value = true
  }
})
watch(speedRequest, (newRequest) => {
  if (newRequest) {
    SpeedUp()
    emit("response2", false)
  }
})
function RunGame(input) {
  let window = iframedom.value.contentWindow
  window.postMessage({type: "rungame", msg: input, id: ++gameId}, "*")
  players.value = input
}
function SpeedUp() {
  let window = iframedom.value.contentWindow
  window.postMessage({type: "speedup"}, "*")
}
onMounted(() => {
})
</script>

<template>
  <div id="arena" class="arena">
    <iframe id="arenaiframe" src="./arena.html" ref="iframedom" frameborder="0" class="arena"></iframe>
    <!-- <Arena :key="gameId" :player-string="players" :identity="gameId"/> -->
  </div>
</template>

<style>
.arena {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
#arenaiframe {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>