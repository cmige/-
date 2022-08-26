<template>
  <el-row style="height: 100%">
    <div style=" width: 100%; height: 500px"  v-if="!isNull(store.provinceTotal)">
      <el-table
          :data="getTableData"
          style="width: 100%"
          max-height="500"
          border
          class="mytable"
      >
        <el-table-column
            v-for="(item,index) in labelKeys"
            :key="item"
            class-name="table-item"
            label-class-name="label-item"
            min-width="40"
            align="center"
            :property="item"
            :label="label[item]"
        />

      </el-table>
    </div>
    <div ref="barRef" class="barRef"></div>
  </el-row>
  <el-row>
  </el-row>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from 'vue'
import type { ElTable } from 'element-plus'
import { useEpidemic } from "@/stores/epidemicInfo";
import {storeToRefs} from "pinia";
import {isNull} from "@/utils/others"

const store = useEpidemic()
const label = {
  area:"地区",
  confirmIncrease: "新增确诊",
  totalConfirm: "累计确诊",
  totalHeal: "累计治愈",
  totalDead: "累计死亡"
}
const labelKeys = Object.keys(label)
type Prop = {
  selectedProvince: string
}

const props = defineProps<Prop>()
const barRef = ref<null|HTMLElement>()
const emits = defineEmits(["getChildRef"])
onMounted(()=>{
  nextTick(()=>{
    emits('getChildRef', { cityBar: barRef})
  })
})

const getTableData = computed(()=>{
  if (!isNull(store.provinceTotal)){
    const rawData = store.provinceTotal.filter(item => item.name === props.selectedProvince)[0]?.children
    const data: any = []
    rawData.forEach(city => {
      data.push({
        area: city.name,
        confirmIncrease: city.today.confirm,
        totalConfirm: city.total.confirm,
        totalHeal: city.total.heal,
        totalDead: city.total.dead
      })
    })
    return data
  }
  return []
})
</script>

<style scoped lang="less">
.barRef{
  padding: 10px;
  margin-top: 10px;
  width: 100%;
  height: calc(100% - 510px);
  &:hover{
    box-shadow: 0 2px 12px rgba(0,0,0,.3);
    transition: all ease .3s;
  }
}
</style>

<style lang="less">
.label-item{
  font-size: 12px;
  padding: 5px 0 !important;
  font-weight: bold;
}
.table-item{
  font-size: 12px;
  padding: 5px 0 !important;
}
.el-table{
  &.mytable{
    background-color: transparent;
  }
  &.mytable tr{
    background-color: transparent;
  }
  &.mytable td{
    background-color: transparent;
  }
  &.mytable th{
    background-color: transparent;
  }
}

</style>
