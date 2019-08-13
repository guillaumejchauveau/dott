import { Path } from './'

export default class UndefinedPropertyError extends Error {
  constructor (readonly part: Path.Part) {
    super(`No properties matching '${part}'`)
  }
}
