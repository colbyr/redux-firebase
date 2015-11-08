import {
  subscribe,
  unsubscribe,
} from './ActionCreators'
import {
  isLoading,
  resolve,
  subscriptions,
} from './queries'
import { partial } from 'ramda'
import React, { PropTypes } from 'react'
import { connect as connectRedux } from 'react-redux'

let ids = 0
function nextSID() {
  return 'hoc_subscriber_' + ++ids
}

function select(query, rootState, rootProps) {
  return {
    firebaseResult: resolve(query, rootState, rootProps),
    rootProps,
    rootState,
  }
}

export default defaultLoadingComponent => query => (Component, LoadingComponent = defaultLoadingComponent) => {
  return connectRedux(
    partial(select, [query])
  )(
    React.createClass({
      displayName: `Firebase(${Component.displayName})`,

      propTypes: {
        dispatch: PropTypes.func.isRequired,
        firebaseResult: PropTypes.object,
        rootProps: PropTypes.object,
        rootState: PropTypes.object,
      },

      componentWillMount() {
        this.updateSubscriptions(this.props)
      },

      componentWillReceiveProps(nextProps) {
        this.updateSubscriptions(nextProps)
      },

      componentWillUnmount() {
        const {dispatch} = this.props
        dispatch(
          unsubscribe(
            this._sid,
            this._lastSubscriptions.toJS()
          )
        )
      },

      render() {
        if (isLoading(this.props.firebaseResult)) {
          return LoadingComponent ? <LoadingComponent /> : null
        }
        const { firebaseResult, rootProps } = this.props
        return (
          <Component
            {...rootProps}
            {...firebaseResult.toObject()}
          />
        )
      },

      updateSubscriptions({dispatch, rootProps, rootState}) {
        if (!this._sid) {
          this._sid = nextSID()
        }
        const newSubscriptions = subscriptions(query, rootState, rootProps)
        if (newSubscriptions.equals(this._lastSubscriptions)) {
          return
        }
        this._lastSubscriptions = newSubscriptions
        dispatch(
          subscribe(
            this._sid,
            this._lastSubscriptions.toJS()
          )
        )
      },
    })
  )
}
