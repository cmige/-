export const resolveFn = Promise.resolve()


export const replaceFn = (obj: string, reg: any, replacement: any) => String.prototype.replace.call(obj, reg, replacement)

export const isNull = (obj: any) => {
    if (typeof obj === "object"){
        if (obj instanceof Array){
            return obj.length === 0
        }
        if (obj === null) return true
        return Object.keys(obj).length === 0
    }else if (typeof obj === "function"){
        return false
    }else if (typeof obj === "string"){
        return obj.length === 0
    }else if (typeof obj === "number"){
        return obj === 0
    }else {
        return true
    }
}