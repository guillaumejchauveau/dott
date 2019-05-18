import test from 'ava'
import * as matrixec from 'matrixec'
import * as DotT from '../lib'
import * as classes from './fixtures/classes'
import * as paths from './fixtures/paths'
import * as data from './fixtures/data'

test('should format paths', t => {
  const args = new Map([
    ['path', paths.paths1],
    ['opts', [
      {
        pathFormat: DotT.Path.Formats.Array
      }
    ]]
  ])

  t.deepEqual(matrixec.execute(args, DotT.Path.format), paths.formattedPaths1)
})

test('should match keys', t => {
  /**
   * @implements {DotT.PartialOptions}
   */
  const opts = {
    enableSpecialParts: true,
    specialParts: {
      '*': /^.*$/
    },
    pathFormat: DotT.Path.Formats.Array
  }
  t.deepEqual(DotT.Path.partMatchingKeys(
    data.data1,
    'a',
    opts
  ), ['a'])
  t.deepEqual(DotT.Path.partMatchingKeys(
    data.data1,
    /^[ab]$/,
    opts
  ), ['a', 'b'])
  t.deepEqual(DotT.Path.partMatchingKeys(
    data.data1,
    'd',
    opts
  ), [])
  t.deepEqual(DotT.Path.partMatchingKeys(
    data.data1.c.ca.caa,
    /^caa[ab]$/,
    {
      exclude: [classes.B],
      pathFormat: DotT.Path.Formats.Array
    }
  ), ['caaa', 'caab'])
  t.deepEqual(DotT.Path.partMatchingKeys(
    data.data1,
    /^[ad]$/,
    opts
  ), ['a'])
  t.deepEqual(DotT.Path.partMatchingKeys(
    data.data1.a.ab,
    '0',
    opts
  ), ['0'])
  t.deepEqual(
    DotT.Path.partMatchingKeys(
      data.data1,
      '*',
      opts
    ),
    ['a', 'b', 'c']
  )
  t.deepEqual(
    DotT.Path.partMatchingKeys(
      data.data1.a.ab,
      '*',
      opts
    ),
    ['0', '1']
  )
})

test('should relate paths', t => {
  t.true(DotT.Path.arePathsRelated('foo.bar', 'foo'))
  t.true(DotT.Path.arePathsRelated('foo', 'foo.bar'))
  t.false(DotT.Path.arePathsRelated('foo.bar', 'foo.baz'))
  t.true(DotT.Path.arePathsRelated('foo.bar', 'foo.bar'))
  t.throws(function() {
    DotT.Path.arePathsRelated('foo.bar', ['foo', new RegExp('bar')])
  }, Error)
  t.throws(function() {
    DotT.Path.arePathsRelated('foo.*.a', 'foo.*.b', {
      enableSpecialParts: true
    })
  }, Error)
})

test('should detect RegExp parts', t => {
  /**
   * @implements {DotT.PartialOptions}
   */
  const opts = {
    enableSpecialParts: true
  }
  t.false(DotT.Path.isPathContainingRegExp('foo.bar', opts))
  t.true(DotT.Path.isPathContainingRegExp('foo.*', opts))
  t.true(DotT.Path.isPathContainingRegExp('foo.*.a.*.c', opts))
})
