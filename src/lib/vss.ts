import Diff from 'diff-match-patch'
import _ from 'lodash'

const dmp = new Diff.diff_match_patch()

export const compareMetadata = (current: any, target: any) => {
  if (!current || !target) {
    return null
  }
  const resultCurrent: Record<string, any> = {}
  const resultTarget: Record<string, any> = {}
  try {
    for (const key of Object.keys(current)) {
      const currentValue = current[key]
      const targetValue = target[key]

      if (currentValue === targetValue) {
        continue
      }

      if (!targetValue) {
        resultCurrent[key] = { diff: 1 }
        continue
      }

      if (Array.isArray(currentValue) && Array.isArray(targetValue)) {
        resultCurrent[key] = {
          valueDiff: currentValue.map((i, index) => [
            targetValue.includes(i) ? 0 : 1,
            `${String(i) + (index === currentValue.length - 1 ? '' : ', ')}`,
          ]),
        }
        resultTarget[key] = {
          valueDiff: targetValue.map((i, index) => [
            currentValue.includes(i) ? 0 : -1,
            `${String(i) + (index === currentValue.length - 1 ? '' : ', ')}`,
          ]),
        }
        continue
      }

      if (typeof currentValue === 'string' && typeof targetValue === 'string') {
        const diff = dmp.diff_main(currentValue, targetValue)
        dmp.diff_cleanupSemantic(diff)

        resultCurrent[key] = {
          valueDiff: diff.filter(([type]) => type === 1 || type === 0),
        }
        resultTarget[key] = {
          valueDiff: diff.filter(([type]) => type === -1 || type === 0),
        }
        continue
      }

      resultCurrent[key] = { valueDiff: 1 }
      resultTarget[key] = { valueDiff: -1 }
    }

    for (const key of Object.keys(target)) {
      if (!current[key]) {
        resultTarget[key] = { diff: -1 }
      }
    }
  } catch (error) {
    console.error('Error comparing metadata:', error)
  }

  return {
    current: _.isEmpty(resultCurrent) ? null : resultCurrent,
    target: _.isEmpty(resultTarget) ? null : resultTarget,
  }
}
