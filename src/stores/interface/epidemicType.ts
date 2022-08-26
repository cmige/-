export interface EpidemicData  {
    chinaTotal: ChinaTotal;
    chinaDayList: ChinaDayList[];
    lastUpdateTime: string;
    overseaLastUpdateTime: string;
    areaTree: AreaTree[];
}

export interface ChinaTotal {
    today: Today;
    total: Total;
    extData: ExtData;
}

export interface Today {
    confirm?:  number;
    suspect?:  number;
    heal?:  number;
    dead?: number;
    input?:number;
    severe?: any;
    storeConfirm?: number;
}

export interface Total {
    confirm: number;
    suspect: number;
    heal: number;
    dead: number;
    severe?: number;
    input: number;
    storeConfirm?: number;
}

export interface ExtData {
    noSymptom?: number;
    incrNoSymptom?: number;
}

export interface ChinaDayList {
    date: string;
    today: Today;
    total: Total;
    extData?: any;
    lastUpdateTime?: any;
}

export interface AreaTree {
    today: Today;
    total: Total;
    extData: ExtData;
    name: string;
    id: string;
    lastUpdateTime: string;
    children: any[];
}