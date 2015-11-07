import Firebase from 'firebase'
import { fromJS } from 'immutable'
import { partial } from 'ramda'

export const instance = new Firebase(__FIREBASE__)

function promiseCall(method, args) {
  return new Promise((resolve, reject) => {
    instance[method](args, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

export const authWithPassword = partial(promiseCall, ['authWithPassword'])
export const changeEmail = partial(promiseCall, ['changeEmail'])
export const changePassword = partial(promiseCall, ['changePassword'])
export const createUser = partial(promiseCall, ['createUser'])
export const removeUser = partial(promiseCall, ['removeUser'])
export const resetPassword = partial(promiseCall, ['resetPassword'])

export function getAuth() {
  return instance.getAuth()
}

function serializeData(data) {
  if (!data || typeof data.toJS !== 'function') {
    return data
  }
  return data.toJS()
}

function baseWrite(operation, keyPath, data) {
  const ref = instance.child(keyPath.join('/'))
  return new Promise((resolve, reject) => {
    const newRef = ref[operation](serializeData(data), err => {
      if (err) {
        reject(err)
      } else {
        resolve([data, (newRef || ref).path.slice()])
      }
    })
  })
}

export const setIn = partial(baseWrite, ['set'])

export function deleteIn(keyPath) {
  return setIn(keyPath, null)
}

export const pushIn = partial(baseWrite, ['push'])

export function subscribe(keyPath, handler) {
  return instance.child(keyPath.join('/')).on('value', handler)
}

export function transactionIn(keyPath, operation) {
  const ref = instance.child(keyPath.join('/'))
  return new Promise((resolve, reject) => {
    ref.transaction(currentData => {
      return serializeData(
        operation(
          fromJS(currentData)
        )
      )
    }, (error, committed, snapshot) => {
      if (error) {
        reject(error)
      } else if (!committed) {
        reject(null)
      } else {
        resolve([fromJS(snapshot.val()), ref.path.n])
      }
    })
  })
}

export const updateIn = partial(baseWrite, ['update'])
