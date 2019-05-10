const classes = require('./classes')

const data1 = {
  a: {
    aa: 'aaaa',
    ab: ['abab', 'abab'],
    ac: {
      aca: 1
    }
  },
  b: 1,
  c: {
    ca: {
      caa:{
        caaa: new classes.A(),
        caab: new classes.B()
      }
    },
    cb: {
      caa: {
        cbaa: new classes.A(),
        cbab: new classes.B()
      }
    }
  }
}

const data2 = {
  a: {
    aa: 'aaaa',
    ab: ['abab', 'abab'],
    ac: {
      aca: 1
    }
  },
  b: 1,
  c: {
    ca: {
      caa:{
        caaa: new classes.A(),
        caab: new classes.B()
      }
    }
  },
  f: 'string',
  g: {
    ga: 1,
    gb: 1,
    gc: 1,
    gd: 1
  },
  h: new classes.B()
}

module.exports = {
  data1,
  data2
}
