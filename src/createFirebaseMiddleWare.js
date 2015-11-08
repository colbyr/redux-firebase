import { PATHS_SUBSCRIBED, PATHS_UNSUBSCRIBED } from './ActionTypes'
import debounce from 'debounce'
import { sync } from './ActionCreators'
import { fromJS, Map } from 'immutable'
import { partial } from 'ramda'
import SubscriptionRecord from './SubscriptionRecord'

function toStringPath(arrayPath) {
  return arrayPath.join('/')
}

function subscribe(
  firebaseInstance,
  subscriptions,
  sid,
  path,
  handleUpdate,
  handleError
) {
  if (subscriptions.has(path)) {
    return subscriptions.updateIn(
      [path, 'subscribers'],
      subs => subs.add(sid)
    )
  }
  firebaseInstance
    .child(path)
    .on('value', handleUpdate, handleError)
  return subscriptions.set(
    path,
    SubscriptionRecord()
      .set('handler', handleUpdate)
      .updateIn(['subscribers'], subs => subs.add(sid))
  )
}

function unsubscribe(subscriptions, sid, path) {
  if (subscriptions.getIn([path, 'subscribers']).size > 1) {
    return subscriptions.updateIn(
      [path, 'subscribers'],
      subs => subs.remove(sid)
    )
  }
  return subscriptions.delete(path)
}

export default function createFirebaseMiddleware(firebaseInstance) {
  let queue = Map()
  let subscriptions = Map()
  let syncUpdates = debounce((store) => {
    store.dispatch(sync(queue))
    queue = Map()
  })
  let queueUpdate = (store, stringPath, snapshot) => {
    queue = queue.set(
      stringPath,
      fromJS(snapshot.val())
    )
    syncUpdates(store)
  }
  let queueError = (store, stringPath, error) => {
    if (__DEV__) {
      console.error(`Error at \`${stringPath}\`: ${error.message}`)
    }
    queue = queue.set(
      stringPath,
      undefined
    )
    syncUpdates(store)
  }
  return store => next => action => {
    if (action.type === PATHS_SUBSCRIBED) {
      action.payload.paths.forEach(path => {
        let stringPath = toStringPath(path)
        subscriptions = subscribe(
          firebaseInstance,
          subscriptions,
          action.payload.sid,
          stringPath,
          partial(queueUpdate, [store, stringPath]),
          partial(queueError, [store, stringPath])
        )
      })
    }
    if (action.type === PATHS_UNSUBSCRIBED) {
      action.payload.paths.forEach(path => {
        subscriptions = unsubscribe(
          subscriptions,
          action.payload.sid,
          toStringPath(path)
        )
      })
    }
    return next(action)
  }
}
