<template>
  <el-row class="epidemic-container">
    <el-scrollbar v-if="state.currentLayout !== Screen.full" style="width: 100%;">
      <el-col  :xs="24" :sm="24" :md="24" :class="calcWarpStyle" class="height300">
        <div class="left-container" >
          <LayoutLeft
              :currentLayout="state.currentLayout"
              @getChildRef="setChildRefs"
          ></LayoutLeft>
        </div>
      </el-col>
      <el-col  :xs="24" :sm="24" :md="16"
               :class="[
                   calcWarpStyle, {
                    'height800': state.currentLayout === Screen.middle,
                    'height500': state.currentLayout === Screen.small || state.currentLayout === Screen.mobile}
                   ]"
      >
        <div class="main-container" >
          <div
              class="epidemic-container-center"
              ref="chinaMapRef"
          ></div>
        </div>
      </el-col>
      <el-col  :xs="24" :sm="24" :md="8" :class="[calcWarpStyle, {'height800': state.currentLayout !== Screen.full }]" >
        <div class="right-container">
          <LayoutRight
              :selectedProvince="state.selectedProvince"
              @getChildRef="setChildRefs"
          ></LayoutRight>
        </div>
      </el-col>
    </el-scrollbar>

    <el-row :gutter="5" v-else style="height: 100%; width: 100%">
      <el-col   :lg="5" :xl="6" :class="calcWarpStyle">
        <div class="left-container">
          <LayoutLeft
              :currentLayout="state.currentLayout"
              @getChildRef="setChildRefs"
          ></LayoutLeft>
        </div>
      </el-col>
      <el-col   :lg="12" :xl="12" :class="calcWarpStyle">
        <div class="main-container">
          <div
              class="epidemic-container-center"
              ref="chinaMapRef"
          ></div>
          <div class="main-control" @click="fullScreen" v-if="!state.isScreenfull && state.currentLayout === Screen.full">
            点击全屏
          </div>
        </div>
      </el-col>
      <el-col   :lg="7" :xl="6" :class="calcWarpStyle">
        <div class="right-container">
          <LayoutRight
              :selectedProvince="state.selectedProvince"
              @getChildRef="setChildRefs"
          ></LayoutRight>
        </div>
      </el-col>
    </el-row>
  </el-row>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import {
  onMounted,
  ref,
  toRaw,
  reactive,
  nextTick,
  onBeforeMount,
  computed,
  onBeforeUnmount,
  markRaw,
  getCurrentInstance,
  defineAsyncComponent
} from "vue";
import "@/assets/china";
import { useEpidemic } from "@/stores/epidemicInfo";
import { geoCoordMap } from "@/assets/geoMap";
import screenfull from 'screenfull';
import {chartObj, Screen} from "@/utils/static";
import {replaceFn, resolveFn} from "@/utils/others";
import type {EpidemicData} from "@/stores/interface/epidemicType";

const LayoutLeft = defineAsyncComponent(()=>import('@/layout/layout-left/index.vue'))
const LayoutRight = defineAsyncComponent(()=>import('@/layout/layout-right/index.vue'))

const instance = <any>getCurrentInstance()
const chinaMapRef = ref<HTMLElement | null>(null);
const epidemicStore = useEpidemic();

const state = reactive({
  isScreenfull: false,
  clientWidth: 0,
  currentLayout: "",
  childrenRef: {
    pieRef: null,
    lineRef: null,
    barRef: null,
    cityBarRef: null
  },
  selectedProvince: '广东'
})

const calcWarpStyle = computed(()=>{
  switch (state.currentLayout){
    case Screen.full:
      return "warp-default"
    case Screen.middle:
    case Screen.small:
      return "warp-main"
    default:
      return "warp-main"
  }
})
onMounted( async () => {
  await epidemicStore.getData()
  state.selectedProvince = epidemicStore.selectedProvince
  initChinaMapCharts();
  initPie()
  initLine()
  initBar()
  setTimeout(()=>{
    initCityBar()
  })
});

const setChildRefs = (data: any) => {
  if (data.pie) state.childrenRef.pieRef = data.pie
  if (data.line) state.childrenRef.lineRef = data.line
  if (data.bar) state.childrenRef.barRef = data.bar
  if (data.cityBar) state.childrenRef.cityBarRef = data.cityBar
}

onBeforeMount(()=>{
  resizeLayout()
  window.addEventListener("resize", resizeLayout)
})


onBeforeUnmount(()=>{
  window.removeEventListener("resize", ()=>{})
})

const resizeLayout = () => {
  const clientWidth = state.clientWidth = document.body.clientWidth
  const layout = clientWidth >= 1200 ? Screen.full :
      (clientWidth <= 1200 && clientWidth >= 992) ? Screen.middle :
      (clientWidth <= 768 ) ? Screen.mobile : Screen.small
  if(!state.currentLayout){
    state.currentLayout = layout
  }else {
    if(
        (state.currentLayout !== Screen.full && layout === Screen.full) ||
        (state.currentLayout === Screen.full && layout !== Screen.full)
    ){
        // 等待 chinaMapRef 的值改变再去重新初始化 ChinaMap
        nextTick(()=>{
          initChinaMapCharts();
        })
        // 等待 setChildRefs 异步任务执行完 改变 childrenRef 后才去初始化 pie 和 line
        setTimeout(()=>{
          // do some things about  pie or line
          resolveFn.then(()=>{
            initPie();
            initLine();
            initBar();
            initCityBar()
          })
        })
    }
    state.currentLayout = layout
  }
}

const initChinaMapCharts = () => {
  nextTick(()=>{
    const data = toRaw(epidemicStore.provinceTotal).map((item) => {
      return {
        name: item.name,
        confirm: item.total.confirm,
        value: geoCoordMap[item.name].concat(
            item.today.confirm as number,
            item.total.heal
        ),
        selected: item.name === state.selectedProvince
      };
    })
    const option = {
      tooltip: {
        trigger: "item",
        formatter: (val: any) => {
          const name = val.name;
          const todayConfirm = val.data?.value[2];
          const totalConfirm = val.data?.confirm;
          const totalHeal = val.data?.value[3];
          return `<p>${name}<br>新增确诊: ${todayConfirm}<br>累计确诊: ${totalConfirm}<br>累计治愈: ${totalHeal}</p>`;
        },
      },
      geo: {
        id:"_china",
        map: "china",
        aspectScale: 0.8,
        layoutCenter: ["50%", "50%"],
        layoutSize: "100%",
        itemStyle: {
          //  normal: {
          // areaColor: {
          //   type: "linear-gradient",
          //   x: 0,
          //   y: 1200,
          //   x2: 1000,
          //   y2: 0,
          //   colorStops: [
          //     {
          //       offset: 0,
          //       color: "#152E6E", // 0% 处的颜色
          //     },
          //     {
          //       offset: 1,
          //       color: "#0673AD", // 50% 处的颜色
          //     },
          //   ],
          //   global: true, // 缺省为 false
          // },
          shadowColor: "#0f5d9d",
          shadowOffsetX: 0,
          shadowOffsetY: 15,
          opacity: 0.5,
          // },
        },
        emphasis: {
          itemStyle: {
            areaColor: "#0f5d9d",
          }
        },

        regions: [
          {
            name: "南海诸岛",
            itemStyle: {
              areaColor: "rgba(0, 10, 52, 1)",
              borderColor: "rgba(0, 10, 52, 1)",
              //normal: {
              opacity: 0,
              label: {
                show: false,
                color: "#009cc9",
              },
              //},
            },
            label: {
              show: false,
            },
          },
          {
            name: data.filter(item=>item.selected === true)[0].name,
            selected: true,
            select:[
              {
                itemStyle: {
                  color: "red"
                }
              }
            ]
          }
        ],
      },
      // 要显示的散点数据
      series: [
        {
          type: "map",
          map: "china",
          aspectScale:0.8,
          layoutCenter: ["50%", "50%"],
          layoutSize: "100%",
          label: {
            show: true,
            color: "#FFFFFF",
            fontSize: 12,
          },
          itemStyle: {
            areaColor: "#0c3653",
            borderColor: "#1cccff",
            borderWidth: 1.8,
          },
          data: data
        },
        {
          type: "scatter",
          coordinateSystem: "geo",
          symbol: "pin",
          symbolSize: [45, 45],
          label: {
            show: true,
            color: "#fff",
            formatter(value: any) {
              return value.data.value[2];
            },
          },
          itemStyle: {
            color: "#1E90FF", //标志颜色
          },
          data: data,
        },
      ],

    };
    const charts = echarts.init(chinaMapRef.value as HTMLElement);
    charts.setOption(option);
    charts.on("click", (val: any) => {
      if (val.name === '南海诸岛') return
      state.selectedProvince = val.data!.name;
      epidemicStore.selectedProvince = val.data!.name;
      instance.proxy.mittBus.emit("getCitys")
    });
    window.addEventListener("resize",()=>{
      charts.resize()
    })
  })
};

const initPie = () => {
  nextTick(()=>{
    const charts = echarts.init(state.childrenRef.pieRef! as HTMLElement)
    let dataArr:{name:string,value:number}[] = []
    let provinceTotal = markRaw(epidemicStore.provinceTotal).sort((a,b)=> b.total.confirm - a.total.confirm)
    epidemicStore.provinceTotal.sort((a,b)=> b.total.confirm - a.total.confirm)
    for (let i=0; i<10; i++){
      dataArr.push({
        name:provinceTotal[i].name,
        value: provinceTotal[i].total.confirm / 10000
      })
    }
    const option = {
      title: {
        text: '国内累计确诊前十省',
        left: 'left',
        textStyle: {
          fontSize: 12
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: `{a} <br/>{b} : {c}万 ({d}%)`
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        top:'bottom',
        data: dataArr.map(e => e.name),
        itemHeight:10,
        itemWidth:15
      },
      series: {
        name: '累计确诊',
        type: 'pie',
        radius: '55%',
        bottom: '10%',
        center: ['50%', '60%'],
        data: dataArr,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    };
    charts.setOption(option)
    window.addEventListener("resize",()=>{
      charts.resize()
    })
    instance.proxy.mittBus.on("pieChartResize", ()=> charts.resize())
  })
}

const getLineData = (data: EpidemicData) => {
  const chinaDayList = toRaw(data.chinaDayList).slice(44)
  const nameMap = chartObj.line.nameMap
  const chinaDateList: any[] = []
  for (let i = chinaDayList.length; i > 0; i--){
    for (let key in nameMap){
      let totalConfirm = 0
      let totalDead = 0
      let totalHeal = 0
      if (i === chinaDayList.length){
        totalConfirm = data.chinaTotal.total.confirm / 10000
        totalDead = data.chinaTotal.total.dead / 10000
        totalHeal = data.chinaTotal.total.heal / 10000
      }else {
       totalConfirm = chinaDayList[i-1].total.confirm / 10000
       totalDead = chinaDayList[i-1].total.dead / 10000
       totalHeal = chinaDayList[i-1].total.heal / 10000
      }
      switch (key){
        case "currentConfirm":
          push(chinaDateList, (totalConfirm-totalDead-totalHeal), nameMap[key], chinaDayList[i-1].date)
          break
        case "totalConfirm":
          push(chinaDateList, totalConfirm, nameMap[key], chinaDayList[i-1].date)
          break
        case "totalDead":
          push(chinaDateList, totalDead, nameMap[key], chinaDayList[i-1].date)
          break
        case "totalHeal":
          push(chinaDateList, totalHeal, nameMap[key], chinaDayList[i-1].date)
          break
        default: break
      }
    }
  }

  function push(obj:any[], value: number, name: string, dateStr: string){
    obj.push([value, name, dateStr, replaceFn(dateStr, /\-/g, "")])
  }
  chinaDateList.sort().unshift(["Value", "Name", "Date","Compare"])
  return chinaDateList
}
const initLine = () => {
  nextTick(()=>{
    const dataList = getLineData(epidemicStore.data)
    const charts = echarts.init(state.childrenRef.lineRef! as HTMLElement)
    const names = [
      chartObj.line.nameMap.currentConfirm,
      chartObj.line.nameMap.totalConfirm,
      chartObj.line.nameMap.totalDead,
      chartObj.line.nameMap.totalHeal,
    ]
    const datasetWithFilters: any[] = [];
    const seriesList:any[] = [];
    echarts.util.each(names, function (name) {
      var datasetId = 'dataset_' + name;
      datasetWithFilters.push({
        id: datasetId,
        name:name,
        fromDatasetId: 'dataset_raw',
        transform: {
          type: 'filter',
          config: {
            and:[
              { dimension: 'Compare', gte: 0 },
              { dimension: 'Name', "=": name },
            ]
          }
        }
      });
      seriesList.push({
        type: 'line',
        datasetId: datasetId,
        showSymbol: false,
        name: name,
        endLabel: {
          show: true,
          formatter: function (params: any) {
            return params.value[1] + ': ' + params.value[0] + "万";
          }
        },
        labelLayout: {
          moveOverlap: 'shiftY'
        },
        emphasis: {
          focus: 'series'
        },
        encode: {
          x: 'Date',
          y: 'Value',
          label: ['Name', 'Value'],
          itemName: 'Date',
          tooltip: ['Value']
        },
        tooltip:{
          valueFormatter: function (value: any) {
            return value + '万';
          }
        },
      });
    });
    const option = {
      animationDuration: 10000,
      dataset: [
        {
          id: 'dataset_raw',
          source: dataList
        },
        ...datasetWithFilters
      ],
      legend:{
        data:names,
        left:"center",
        top:"bottom"

      },
      title: {
        text: '全国疫情日增长数据',
        left: 'left',
        textStyle: {
          fontSize: 12
        }
      },
      tooltip: {
        order: 'valueDesc',
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        nameLocation: 'start'
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: '{value}万'
        }
      },
      grid: {
        left: '3%',
        right: 140,
        bottom: '20%',
        containLabel: true
      },
      series: seriesList
    };
    charts.setOption(option)
    window.addEventListener("resize",()=>{
      charts.resize()
    })
    instance.proxy.mittBus.on("lineChartResize", ()=> charts.resize())
  })
}

const getBarData = (data: EpidemicData) => {
  const chinaTotal = toRaw(data.chinaTotal)
  const input = chinaTotal.total.input
  const noSymptom = chinaTotal.extData.noSymptom ?? 0
  const totalConfirm = chinaTotal.total.confirm
  const totalDead = chinaTotal.total.dead
  const totalHeal = chinaTotal.total.heal
  const confirm = totalConfirm - totalDead - totalHeal

  let abroadTotalConfirm = 0
  let abroadTotalDead = 0
  let abroadTotalHeal = 0
  epidemicStore.data.areaTree.forEach(country => {
    if(country.name !== "中国"){
      abroadTotalConfirm += country.total.confirm
      abroadTotalDead += country.total.dead
      abroadTotalHeal += country.total.heal
    }
  })
  abroadTotalConfirm -= totalConfirm
  const outerData = [
    {
      value: totalConfirm / 10000,
      groupId: chartObj.bar.china,
      itemStyle:{
        color: "#5470C6"
      }
    },
    {
      value: abroadTotalConfirm / 10000,
      groupId: chartObj.bar.abroad,
      itemStyle:{
        color: "#91CC75"
      }
    }
  ]
  const innerData = [
    {
      dataGroupId: chartObj.bar.china,
      itemColor: "#5470C6",
      markPointColor: "#5470C6",
      data: [
        [chartObj.chinaDetail.input, input /10000],
        [chartObj.chinaDetail.noSymptom, noSymptom /10000],
        [chartObj.chinaDetail.confirm, confirm /10000],
        [chartObj.chinaDetail.totalConfirm, totalConfirm /10000],
        [chartObj.chinaDetail.totalDead, totalDead /10000],
        [chartObj.chinaDetail.totalHeal, totalHeal /10000],

      ]
    },
    {
      dataGroupId: chartObj.bar.abroad,
      itemColor: "#91CC75",
      markPointColor: "#91CC75",
      data: [
        [chartObj.abroadDetail.totalConfirm, abroadTotalConfirm / 10000],
        [chartObj.abroadDetail.totalDead, abroadTotalDead / 10000],
        [chartObj.abroadDetail.totalHeal, abroadTotalHeal / 10000],

      ]
    },
  ]
  return {
    outerData,
    innerData
  }
}

const initBar = () => {
  nextTick(()=>{
    const charts = echarts.init(state.childrenRef.barRef! as HTMLElement)
    const {outerData, innerData} = getBarData(epidemicStore.data)
    const option = {
      title: {
        text: '全球疫情数据',
        left: 'left',
        textStyle: {
          fontSize: 12
        }
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: [chartObj.bar.china, chartObj.bar.abroad],
        left: 'center',
        top:'bottom'
      },
      xAxis: {
        data: [chartObj.bar.title],
        axisLabel: {
          interval:0,
          rotate:0
        },
      },
      yAxis: [
        {
          type: 'value',
          name: chartObj.bar.china,
          interval: 200,
          axisLabel: {
            formatter: '{value}万'
          }
        },
        {
          type: 'value',
          name: chartObj.bar.abroad,
          interval: 20000,
          axisLabel: {
            formatter: '{value}万'
          }
        }
      ],
      dataGroupId: '',
      animationDurationUpdate: 500,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      series: [
        {
          name: chartObj.bar.china,
          id: chartObj.bar.china,
          type: 'bar',
          data: [outerData[0]],
          tooltip: {
            valueFormatter: function (value: any) {
              return value + '万';
            }
          },
          universalTransition: {
            enabled: true,
          }
        },
        {
          name: chartObj.bar.abroad,
          id: chartObj.bar.abroad,
          type: 'bar',
          yAxisIndex: 1,
          data:  [outerData[1]],
          tooltip: {
            valueFormatter: function (value: any) {
              return value + '万';
            }
          },
          universalTransition: {
            enabled: true,
          }
        }
      ]
    };
    const drilldownData = innerData
    charts.on('click', function (event) {
      if (event.data) {
        var subData = drilldownData.find(function (data) {
          return data.dataGroupId === (event.data as any).groupId;
        });
        if (!subData) {
          return;
        }
        charts.setOption({
            tooltip: {
              trigger: 'item',
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
            },
            xAxis: {
              data: subData.data.map(function (item) {
                return item[0];
              }),
              axisLabel: {
                interval:0,
                rotate:40
              },

            },
            yAxis:{
              type: "value",
              interval: event.seriesId === chartObj.bar.china? 200 : 20000,
              axisLabel: {
                formatter: '{value}万'
              }
            },
            series:{
              type: "bar",
              id: event.seriesId,
              data: subData.data.map(item => {
                return {
                  value : item[1],
                  itemStyle: {
                    color: subData!.itemColor
                  }
                }
              }),
              dataGroupId: subData!.dataGroupId,
              universalTransition: {
                enabled: true,
              },
              tooltip: {
                valueFormatter: function (value: any) {
                  return value + ' 万人';
                }
              },
              markPoint: { // markLine 也是同理
                data: subData.data.map(function (item) {
                  return {
                    coord: [item[0],item[1]],
                    value: item[1] + "万",
                    itemStyle: {
                      color: subData!.markPointColor
                    }
                  };
                }),
              }
            },
            graphic: [
              {
                type: 'text',
                left: 50,
                top: 20,
                style: {
                  text: 'Back',
                  fontSize: 12
                },
                onclick: function () {
                  charts.setOption(option,{notMerge: true});
                }
              }
            ]
          }, {notMerge: true});
      }
    });
    charts.setOption(option)
    window.addEventListener("resize",()=>{
      charts.resize()
    })
    instance.proxy.mittBus.on("barChartResize", ()=> charts.resize())
  })
}

const cityBarData = computed(()=>{
  const citysData =  toRaw(epidemicStore.provinceTotal).filter(province => province.name === state.selectedProvince)[0].children
  citysData.sort((a: any, b: any) => b.total.confirm - a.total.confirm)
  const rawData = citysData.slice(0,11)

  const option = {
    title: {
      text: `${state.selectedProvince}省部分城市疫情数据`,
      left: 'left',
      textStyle: {
        fontSize: 12
      }
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['累计确诊','累计治愈','新增确诊'],
      left: 'center',
      top:'bottom'
    },
    xAxis: {
      type: 'category',
      data: rawData.map(item => item.name),
      axisLabel: {
        interval:0,
        rotate:30
      },
    },
    grid: {
      left: '3%',
      top: '15%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    yAxis:{
      type: 'value'
    },
    series: [
      {
        name:"累计确诊",
        data: rawData.map(item => item.total.confirm),
        type: 'bar',
        markPoint: { // markLine 也是同理
          data: rawData.map(function (item) {
            return {
              coord: [item.name,item.total.confirm],
              value: item.total.confirm ,
              itemStyle: {
                color: "#5470C6"
              }
            };
          }),
        },
        bottom: 50
      },
      {
        name:"累计治愈",
        data: rawData.map(item => item.total.heal),
        type: 'bar'
      },
      {
        name:"新增确诊",
        data: rawData.map(item => item.today.confirm),
        type: 'line',
      },
    ]
  };
  return {
    rawData,
    option
  }
})

const initCityBar = () => {
  nextTick(()=>{
    const charts = echarts.init(state.childrenRef.cityBarRef! as HTMLElement)
    let {option,rawData} = cityBarData.value

    charts.setOption(option)
    window.addEventListener("resize",()=>{
      charts.resize()
    })
    instance.proxy.mittBus.on("getCitys", ()=>{
      let newOption = cityBarData.value.option
      charts.setOption(newOption,{notMerge: true})
    })
    instance.proxy.mittBus.on("citysChartResize", ()=> charts.resize())
  })
}

const fullScreen = () => {
  if (!screenfull.isEnabled) {
    return false;
  }

  screenfull.toggle();

  screenfull.on('change', () => {
    // 全屏切换可能会导致 echart 实例的样式错位，需要 重新resize echart
    instance.proxy.mittBus.emit('citysChartResize')
    instance.proxy.mittBus.emit('barChartResize')
    instance.proxy.mittBus.emit('lineChartResize')
    instance.proxy.mittBus.emit('pieChartResize')
    if (screenfull.isFullscreen) state.isScreenfull = true;
    else state.isScreenfull = false;
  });
}
</script>

<style scoped lang="less">
@import "layout";
</style>
