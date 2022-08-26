import {defineStore} from "pinia";
import Http from "@/http";
import API from "@/http/api";
import type {EpidemicData, AreaTree, ChinaTotal, ChinaDayList} from "@/stores/interface/epidemicType"
import {toRaw} from "vue";



export const requestData = async () => {
    return Http.get(API.getEpidemicDate)
}

interface LineChartsData {
    xAxis:any[],
    addUpData:any[],
    nowData:any[],
    deadData:any[],
    healData:any[]
}

export const useEpidemic = defineStore("epidemicInfo",{
    state:()=>{
        return{
            data: <EpidemicData>{},
            provinceTotal: <AreaTree[]>[],
            cityTotal: <AreaTree[]>[],
            chinaTotal: <ChinaTotal>{},
            selectedProvince: "广东"
        }
    },
    actions:{
        async getData(){
            const result: EpidemicData = await requestData()
            this.data = result
            this.chinaTotal = result.chinaTotal
            this.provinceTotal = result.areaTree.filter(country=>country.name === "中国")[0].children
            this.cityTotal = this.provinceTotal?.filter(city => city.name === "广东")[0].children
        },
    },
})

