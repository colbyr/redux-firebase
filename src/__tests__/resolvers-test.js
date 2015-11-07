jest
  .dontMock('../resolvers')
  .dontMock('../queries')

import { fromJS } from 'immutable'

describe('resolvers', () => {
  let resolvers

  beforeEach(() => {
    resolvers = require('../resolvers')
  })

  it('retrieves a value', () => {
    const {value} = resolvers
    const mockVal = 'testing-wow'
    expect(value(mockVal)).toBe(mockVal)
  })

  it('constructs a proper get query', () => {
    const {get, value} = resolvers
    expect(get('testing')).toEqual({
      testing: value,
    })
  })

  it('constructs a valid getIn query', () => {
    const {getIn, value} = resolvers
    expect(getIn('one', 'two', 'three')).toEqual({
      one: {
        two: {
          three: value,
        },
      },
    })
  })

  it('constructs a valid index query', () => {
    const {index} = resolvers
    const indexResolver = index(['users'])
    const mockCache = fromJS({
      users: {
        '123': {
          name: 'one',
          friends: {
            '456': true,
            '789': true,
          },
        },
        '456': { name: 'two' },
        '789': { name: 'three' },
      },
    })
    const mockState = { firebase: mockCache }
    const value = mockCache.getIn(['users', '123', 'friends'])
    expect(
      indexResolver.subscriptions(value)
    ).toEqual([
      ['users', '456'],
      ['users', '789'],
    ])
    expect(
      indexResolver.values(value, mockState, {}).toJS()
    ).toEqual({
      '456': { name: 'two' },
      '789': { name: 'three' },
    })
  })
})
