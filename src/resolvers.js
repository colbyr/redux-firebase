import { fromJS, List, OrderedMap, Set } from 'immutable'
import { isUnresolved, Resolver, UNRESOLVED } from './types'

const emptyResolver = Resolver()

function cget(cache, path) {
  if (cache.hasIn(path)) {
    return cache.getIn(path)
  }
  return UNRESOLVED
}

export function byIndex(pathToIndex) {
  pathToIndex = List(pathToIndex)
  return emptyResolver.merge({
    subscriptions(_, keyPath, cache) {
      const indexVal = cget(cache, pathToIndex)
      if (isUnresolved(indexVal)) {
        return [pathToIndex]
      }
      return indexVal ? indexVal.keySeq()
        .map(id => keyPath.push(id))
        .concat([pathToIndex])
        .toSet() : Set()
    },
    resolve(allItems, cache) {
      const indexVal = cget(cache, pathToIndex)
      if (isUnresolved(indexVal)) {
        return UNRESOLVED
      }
      return indexVal ?  indexVal.map((_, id) => {
        let res = cget(allItems, [id])
        if (!res) {
          return res
        }
        return res.set('_path', pathToIndex.push(id))
      }) : OrderedMap()
    },
  })
}

export function value(val) {
  return val
}

export function get(key) {
  return {
    [key]: value,
  }
}

export function getIn(head, ...tail) {
  if (!tail.length) {
    return get(head)
  }
  return {
    [head]: getIn(...tail),
  }
}

export const each = resolver => val => {
  if (isUnresolved(val)) {
    return val
  }
  return val ? val.map(() => fromJS(resolver)) : OrderedMap()
}

export function index(pathTo) {
  pathTo = List(pathTo)
  return emptyResolver.merge({
    subscriptions(val, keyPath) {
      if (isUnresolved(val)) {
        return [keyPath]
      }
      return val.keySeq()
        .map(id => pathTo.push(id))
        .concat([keyPath])
        .toSet()
    },
    resolve(indexMap, cache) {
      return indexMap ?
        indexMap.map((_, id) => cget(cache, pathTo.push(id))) :
        OrderedMap()
    },
  })
}

export function key(pathTo) {
  pathTo = List(pathTo)
  return emptyResolver.merge({
    subscriptions(id, keyPath) {
      if (isUnresolved(id)) {
        return [keyPath]
      }
      return [keyPath, pathTo.push(id)]
    },
    resolve(id, cache) {
      const path = pathTo.push(id)
      return cget(cache, path).set('_path', path)
    },
  })
}
