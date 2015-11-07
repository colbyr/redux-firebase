import {
  PATHS_SYNCED,
  PATHS_SUBSCRIBED,
  PATHS_UNSUBSCRIBED,
} from './ActionTypes'
import { createAction } from 'redux-actions'

const doSubscribe = createAction(FIREBASE_PATHS_SUBSCRIBED)
export function subscribe(sid, paths) {
  return doSubscribe({paths, sid})
}

const doSync = createAction(FIREBASE_PATHS_SYNCED)
export function sync(updates) {
  return doSync(updates)
}

const doUnsubscribe = createAction(FIREBASE_PATHS_UNSUBSCRIBED)
export function unsubscribe(sid, paths) {
  return doUnsubscribe({paths, sid})
}
