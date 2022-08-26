<template>
<el-row class="layout-left" :class="calcWrapStyle">
  <el-col :xs="24" :sm="8" :md="8" :lg="24" :xl="24" class="item">
    <div ref="barRef" style="width: 100%;height: 100%"></div>
  </el-col>
  <el-col :xs="24" :sm="8" :md="8" :lg="24" :xl="24" class="item item0">
    <div ref="pieRef" class="pieChart" style="width: 100%;height: 100%"></div>
  </el-col>
  <el-col :xs="24" :sm="8" :md="8" :lg="24" :xl="24" class="item">
    <div ref="lineRef" style="width: 100%;height: 100%"></div>
  </el-col>
</el-row>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, reactive, ref, toRaw} from "vue";
import type {AreaTree, ChinaTotal} from "@/stores/interface/epidemicType";
import {Screen} from "@/utils/static";


type Props = {
  currentLayout: string
};
const props = defineProps<Props>();

const pieRef = ref<HTMLElement | null>(null)
const lineRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)

const emits = defineEmits(["getChildRef"])
onMounted(()=>{
  nextTick(()=>{
    emits("getChildRef",{pie: pieRef,line: lineRef, bar: barRef})
  })
})


const calcWrapStyle = computed(()=>{
  switch (props.currentLayout){
    case Screen.full:
      return "flex-column"
    case Screen.middle:
    case Screen.small:
      return "flex-row"
    default:
      return "mobile"
  }
})

</script>

<style scoped lang="less">

.flex-column{
  display: flex;
  flex-direction: column;
  .item{
    flex: 1;
  }
}
.flex-row{
  display: flex;
}
.mobile{
  min-height: 750px;
  .item{
    min-height: 250px;
  }
}

.layout-left{
  height: 100%;
  width: 100%;
  min-height: 300px;

  .item{
    padding: 10px;
    &:hover{
      box-shadow: 0 2px 12px rgba(0,0,0,.3);
      transition: all ease .3s;
    }
  }

}

</style>
