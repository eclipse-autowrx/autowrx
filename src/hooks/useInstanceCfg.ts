import instance from '../../instance.js'

const useParnerList = () => {
  let instances = [] as any[]
  if (
    instance &&
    instance.partners &&
    Array.isArray(instance.partners) &&
    instance.partners.length > 0
  ) {
    instances = instance.partners
  }

  return instances
}

const useTextLib = () => {
  let text = {} as any
  if (instance && instance.text) {
    text = instance.text
  }

  return text
}

const usePolicy = () => {
  if (instance && instance.policy_url && instance.policy_url.length > 0) {
    return instance.policy_url
  }

  return ''
}

export { useParnerList, useTextLib, usePolicy }
