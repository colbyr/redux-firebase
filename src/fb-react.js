import {
  subscribe,
  unsubscribe,
} from '../../actionCreators/FirebaseActionCreators'
import {
  isLoading,
  resolve,
  subscriptions,
} from './query/queries'
import { partial } from 'ramda'
import React, { PropTypes } from 'react'
import ComponentWithPureRender from 'react-addons-pure-render-mixin'
import { connect as connectRedux } from 'react-redux'
import UILoading from '../../components/ui/UILoading'

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

export const fetch = query => (Component, LoadingComponent = UILoading) => {
  return connectRedux(
    partial(select, [query])
  )(
    React.createClass({
      displayName: `Firebase(${Component.displayName})`,

      mixins: [
        ComponentWithPureRender,
      ],

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
