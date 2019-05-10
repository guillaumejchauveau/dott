const paths1 = [
  'aaaa.bbbb.cccc',
  ['dddd', 'eeee', 'ffff'],
  ['dd.dd', 'eeee', 'ffff'],
  ['gggg', /$h/, 'iiii'],
  'aaaa.0.a',
  ['aaaa', 0, 'a'],
  ['aaaa', '0', 'a']
]
const formattedPaths1 = [
  ['aaaa', 'bbbb', 'cccc'],
  ['dddd', 'eeee', 'ffff'],
  ['dd.dd', 'eeee', 'ffff'],
  ['gggg', /$h/, 'iiii'],
  ['aaaa', '0', 'a'],
  ['aaaa', 0, 'a'],
  ['aaaa', '0', 'a']
]

module.exports = {
  paths1,
  formattedPaths1
}
