import { fromJS } from 'immutable'

jest
  .dontMock('../queries')
  .dontMock('../resolvers')
  .dontMock('../types')

describe('queries', () => {
  let queries
  let resolvers
  let types

  let mockCache
  let mockState

  beforeEach(() => {
    queries = require('../queries')
    resolvers = require('../resolvers')
    types = require('../types')

    mockCache = fromJS({
      one: {
        two: 3,
      },
    })
    mockState = {
      [queries.CACHE_KEY]: mockCache,
      testing: 'omg',
    }
  })

  it('gets the cache from store state', () => {
    const {getCache} = queries
    expect(
      getCache(mockState).equals(mockCache)
    ).toBe(true)
  })

  it('flattens queries', () => {
    let {flatten} = queries
    let mockFn = () => {}
    let mockQuery = fromJS({one: {two: mockFn}})
    expect(
      flatten(mockQuery).toArray()
    ).toEqual([
      [['one', 'two'], mockFn],
    ])
  })

  it('correctly checks if a query isLoading', () => {
    let {isLoading, resolve} = queries
    let {value} = resolvers
    expect(isLoading(
      resolve(
        () => ({one: {two: value}}),
        mockState
      )
    )).toEqual(false)
    expect(isLoading(
      resolve(
        () => ({three: {four: value}}),
        mockState
      )
    )).toEqual(true)
  })

  it('hydrates a query funtion', () => {
    let {hydrate} = queries
    let {value} = resolvers
    let query = ({testing}, {myProp}) => ({
      [testing]: {wow: value},
      [myProp]: {frosted: value},
    })
    expect(
      hydrate(query, mockState, {myProp: 'butts'}).toArray()
    ).toEqual([
      [['omg', 'wow'], value],
      [['butts', 'frosted'], value],
    ])
  })

  it('resolves a query against a cache', () => {
    let {resolve} = queries
    let {value} = resolvers
    let query = () => ({one: {two: value}})
    expect(resolve(query, mockState).toJS()).toEqual({
      one: {
        two: 3,
      },
    })
  })

  it('returns UNRESOLVED for uncached paths', () => {
    let {resolve} = queries
    let {value} = resolvers
    let {UNRESOLVED} = types
    let query = () => ({one: {other: value}})
    expect(resolve(query, mockState).toJS()).toEqual({
      one: {
        other: UNRESOLVED.toJS(),
      },
    })
  })

  it('extracts subscriptions', () => {
    let {subscriptions} = queries
    let {value} = resolvers
    let query = () => ({
      one: {two: value},
      three: {
        four: {five: value},
      },
    })
    expect(subscriptions(query).toJS()).toEqual([
      ['one', 'two'],
      ['three', 'four', 'five'],
    ])
  })
})
