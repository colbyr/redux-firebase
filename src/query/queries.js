import { fromJS, Iterable, List, Map, Set } from 'immutable'
import { value } from './resolvers'
import {
  isResolver,
  isUnresolved,
  UNRESOLVED,
} from './types'

export const CACHE_KEY = 'firebase'

export function getCache(state) {
  return state[CACHE_KEY] || Map()
}

export function flatten(child, cache) {
  return Map().withMutations(resolvers => {
    function setResolvers(keyPath, child) {
      if (child !== value && typeof child === 'function') {
        if (!cache.hasIn(keyPath)) {
          resolvers.set(keyPath, value)
          return
        }
        setResolvers(keyPath, child(cache.getIn(keyPath)))
        return
      }
      if (child === value || isResolver(child)) {
        resolvers.set(keyPath, child)
        return
      }
      if (Map.isMap(child)) {
        child.forEach(
          (grandChild, key) => setResolvers(keyPath.push(key), grandChild)
        )
        return
      }
      console.warn(
        'flatten: invalid value `%s` at `%s`',
        child,
        keyPath
      )
    }
    child.forEach((val, key) => setResolvers(List.of(key), val))
  })
}

export function hydrate(query, state, props) {
  return flatten(
    fromJS(
      query(state, props)
    ),
    getCache(state)
  )
}

export function isLoading(results) {
  if (isUnresolved(results)) {
    return true
  }
  if (Iterable.isIterable(results)) {
    return results.some(isLoading)
  }
  return false
}

export function resolve(query, state, props = {}) {
  const cache = getCache(state)
  return hydrate(query, state, props).reduce(
    (results, resolver, keyPath) => {
      if (!cache.hasIn(keyPath)) {
        return results.setIn(keyPath, UNRESOLVED)
      }
      if (typeof resolver === 'function') {
        return results.setIn(
          keyPath,
          resolver(cache.getIn(keyPath), state, props)
        )
      }
      if (isResolver(resolver)) {
        return results.setIn(
          keyPath,
          resolver.resolve(
            cache.getIn(keyPath),
            cache
          )
        )
      }
      console.warn(
        'resolve: invalid value `%s` at `%s`',
        resolver,
        keyPath
      )
    },
    Map()
  )
}

export function subscriptions(query, state, props) {
  const cache = getCache(state)
  return hydrate(query, state, props)
    .reduce((subs, child, keyPath) => {
      if (!isResolver(child)) {
        return subs.add(keyPath)
      }
      return subs.union(
        child.subscriptions(
          cache.getIn(keyPath) || UNRESOLVED,
          keyPath,
          cache
        )
      )
    }, Set())
}
