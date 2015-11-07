import { Record } from 'immutable'

export const Meta = Record({
  id: '',
  path: [],
})

export const Resolver = Record({
  subscriptions() {},
  resolve() {},
})

export function isResolver(val) {
  return val instanceof Resolver
}

export const UNRESOLVED = Record({
  isLoading: true,
  _path: null,
})()

export function isUnresolved(val) {
  return UNRESOLVED.equals(val)
}
