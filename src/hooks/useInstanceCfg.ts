import instance from '../../instance.js'

const useParnerList = () => {
    let instances = [] as any[]
    if(instance && instance.partners && Array.isArray(instance.partners) && instance.partners.length > 0) {
        instances =  instance.partners
    }

    return instances
}

const useTextLib = () => {
    let text = {} as any
    if(instance && instance.text) {
        text = instance.text
    }

    return text
}

export { useParnerList, useTextLib }