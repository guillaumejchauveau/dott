import test from 'ava'
import * as matrixec from 'matrixec'
import * as DotT from '../lib'
import UndefinedPropertyError from '../lib/UndefinedPropertyError'
import * as classes from './fixtures/classes'
import * as data from './fixtures/data'

test('exists', t => {
  /**
   * @implements {DotT.PartialOptions}
   */
  const opts = {
    exclude: [classes.B],
    enableSpecialParts: true
  }
  const args = new Map([
    ['object', [data.data1]],
    ['path', [
      'a',
      'a.ac.aca',
      'a.ab.0',
      'c.ca.caa.caaa.test',
      'c.ca.caa.caab',
      'c.*.caa.*.test',
      'c.inexistant',
      'inexistant',
      'c.ca.caa.caab.test'
    ]],
    ['opts', [opts]]
  ])

  t.deepEqual(matrixec.execute(args, DotT.exists), [
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    false
  ])
})

test('get', t => {
  /**
   * @implements {DotT.PartialOptions}
   */
  const opts = {
    exclude: [classes.B],
    enableSpecialParts: true
  }
  const args = new Map([
    ['object', [data.data1]],
    ['path', [
      'a',
      'a.ac.aca',
      'a.*',
      'a.ab.*',
      'a.*.aca',
      'c.ca.caa.caaa.test',
      'c.ca.caa.caab',
      'c.*.caa.*.test',
      'c.inexistant',
      'c.ca.caa.caab.test'
    ]],
    ['opts', [opts]],
    ['defaultVal', [42]]
  ])

  t.notThrows(function () {
    t.deepEqual(matrixec.execute(args, DotT.get), [
      [data.data1.a],
      [data.data1.a.ac.aca],
      [
        data.data1.a.aa,
        data.data1.a.ab,
        data.data1.a.ac
      ],
      [
        data.data1.a.ab[0],
        data.data1.a.ab[1]
      ],
      [
        data.data1.a.ac.aca
      ],
      [data.data1.c.ca.caa.caaa.test],
      [data.data1.c.ca.caa.caab],
      [
        data.data1.c.ca.caa.caaa.test,
        data.data1.c.cb.caa.cbaa.test
      ],
      [42],
      [42]
    ])
  })
  t.throws(function () {
    DotT.get(data.data1, 'inexistant')
  }, UndefinedPropertyError)
  t.throws(function () {
    DotT.get(data.data1.a.ab, '2')
  }, UndefinedPropertyError)
})

test('put', t => {
  t.notThrows(function () {
    DotT.put(data.data2, 'd', 'd', {force: true})
    t.is(data.data2.d, 'd')
    DotT.put(data.data2, 'e.ea.eaa', 'e', {force: true})
    t.is(data.data2.e.ea.eaa, 'e')
    DotT.put(data.data2, 'c.ca.caa.caaa', 'caaa is excluded', {
      exclude: [classes.A]
    })
    t.is(data.data2.c.ca.caa.caaa, 'caaa is excluded')
    DotT.put(data.data2, 'a.*', 42, {enableSpecialParts: true})
    t.is(data.data2.a.aa, 42)
    t.is(data.data2.a.ab, 42)
    t.is(data.data2.a.ac, 42)
  })

  t.throws(function () {
    DotT.put(data.data2, 'd.da', 'd is a string')
  }, UndefinedPropertyError)
  t.is(typeof data.data2.d, 'string')

  t.throws(function () {
    DotT.put(data.data2, 'h.test', 'h is excluded', {
      force: true,
      exclude: [classes.B]
    })
  }, UndefinedPropertyError)
  t.is(data.data2.h.test, 'b')
})

test('remove', t => {
  t.notThrows(function () {
    DotT.remove(data.data2, 'a.aa')
    t.is(data.data2.a.aa, undefined)
    DotT.remove(data.data2, 'g.*', {enableSpecialParts: true})
    t.is(data.data2.g.ga, undefined)
    t.is(data.data2.g.gb, undefined)
    t.is(data.data2.g.gc, undefined)
    DotT.remove(data.data2, 'c.ca.caa.caab', {
      exclude: [classes.B]
    })
    t.is(data.data2.c.ca.caa.caab, undefined)
  })

  t.throws(function () {
    DotT.remove(data.data2, 'f.fa')
  }, UndefinedPropertyError)

  t.throws(function () {
    DotT.remove(data.data2, 'h.test', {
      exclude: [classes.B]
    })
  }, UndefinedPropertyError)
  t.is(data.data2.h.test, 'b')
})

test('paths', t => {
  /**
   * @implements {DotT.PartialOptions}
   */
  const opts = {
    exclude: [classes.B]
  }
  t.deepEqual(DotT.paths(data.data1, opts), [
    'a',
    'a.aa',
    'a.ab',
    'a.ab.0',
    'a.ab.1',
    'a.ac',
    'a.ac.aca',
    'b',
    'c',
    'c.ca',
    'c.ca.caa',
    'c.ca.caa.caaa',
    'c.ca.caa.caaa.test',
    'c.ca.caa.caab',
    'c.cb',
    'c.cb.caa',
    'c.cb.caa.cbaa',
    'c.cb.caa.cbaa.test',
    'c.cb.caa.cbab'
  ])

  /**
   * @implements {DotT.PartialOptions}
   */
  const opts2 = {
    exclude: [classes.B],
    pathType: DotT.Path.Types.Leaf
  }
  t.deepEqual(DotT.paths(data.data1, opts2), [
    'a.aa',
    'a.ab.0',
    'a.ab.1',
    'a.ac.aca',
    'b',
    'c.ca.caa.caaa.test',
    'c.ca.caa.caab',
    'c.cb.caa.cbaa.test',
    'c.cb.caa.cbab'
  ])
})
