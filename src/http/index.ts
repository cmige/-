import axios from "axios"
const baseUrl = "http://175.178.192.105:4000"
const instance = axios.create({
    baseURL: baseUrl
})

type HTTP = {
    get: Function
    post: Function
}

const requireGet = (url: string, params?: any):Promise<any> => {
    return new Promise((resolve,reject) => {
        instance.get(url,{
            params: params
        })
            .then(res => resolve(res.data))
            .catch(err => reject(err))
    })
}

const requirePost = (url:string, params?: any) => {
    return new Promise((resolve,reject)=> {
        instance.post(url,params)
            .then(res => resolve(res.data))
            .catch(err => reject(err))
    })
}

const Http:HTTP = {
    get: requireGet,
    post: requirePost
}


export default Http

