import _instance from '../../instance.js'

const instance = _instance as any

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

const useBackground = () => {
  if (instance && instance.background && instance.background.length > 0) {
    return instance.background
  }

  return '/imgs/autowrx-bg.jpg'
}

const useFeatureCards = () => {
  let instances = [] as any[]
  if (
    instance &&
    instance.featureCards &&
    Array.isArray(instance.featureCards) &&
    instance.featureCards.length > 0
  ) {
    instances = instance.featureCards
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

const usePrivacyPolicy = () => {
  if (
    instance &&
    instance.privacy_policy &&
    instance.privacy_policy.length > 0
  ) {
    return instance.privacy_policy
  }

  return ''
}

export {
  useParnerList,
  useTextLib,
  usePolicy,
  useBackground,
  useFeatureCards,
  usePrivacyPolicy,
}
