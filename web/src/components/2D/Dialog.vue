<template>
  <Transition>
    <div class="mask" v-if="isShow">
      <div class="wrapper">
        <div class="title">
          {{ title }}
        </div>
        <div class="content">
          哈哈哈哈哈哈
        </div>
        <div class="footer">
          <button @click="isShow = false">取消</button>
          <button @click="isShow = false">确定</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang='ts'>
import { ref } from 'vue'

const isShow = ref(false)
const title = ref('')

const open = (tit: string) => {
  title.value = tit
  isShow.value = true
}


defineExpose({
  open
})
</script>

<style scoped>

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(233, 233, 233, 0.3);

  .wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 200px;
    background-color: rgb(247, 61, 61);
  }
}
</style>