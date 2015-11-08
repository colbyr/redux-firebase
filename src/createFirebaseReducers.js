import { PATHS_SYNCED } from './ActionTypes'
import { Iterable, List, Map } from 'immutable'
import { handleActions } from 'redux-actions'
import { Meta } from './types'

const emptyMeta = Meta()
function defineMeta(path, value) {
  if (!Iterable.isIterable(value)) {
    return value
  }
  Object.defineProperty(value, 'meta', {
    value: emptyMeta.merge({
      id: path.last(),
      path,
    }),
  })
  value.forEach(
    (child, childKey) => defineMeta(path.push(childKey), child)
  )
  return value
}

function toArrayPath(strPath) {
  return strPath.split('/')
}

export default function createFirebaseReducer(initialState = Map()) {
  return handleActions({
    [PATHS_SYNCED]: (state, {payload}) => {
      return payload.reduce(
        (state, value, path) => {
          let arrayPath = toArrayPath(path)
          return state.setIn(
            arrayPath,
            defineMeta(List(arrayPath), value)
          )
        },
        state
      )
    },
  }, initialState)
}
