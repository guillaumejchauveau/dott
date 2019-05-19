/**
 * TODO: Find a way to properly report errors from recursive operations.
 */

import UndefinedPropertyError from './UndefinedPropertyError'

/**
 * The interface for the user-provided objects.
 * TODO: Wait for TS to support `symbol` as index signature type.
 * https://github.com/Microsoft/TypeScript/issues/1863
 * @interface
 */
export interface Data {
  [key: string]: any,

  [index: number]: any
}

/**
 * User-provided options.
 * @interface
 * @property {string} separator Separator used for the String path format.
 * @property {boolean} enableSpecialParts Determines if registered special parts must processed.
 * @property {object} specialParts An object mapping the corresponding value for a special part.
 * @property {Array<Function>} exclude List of constructors whose instances will be excluded.
 * @property {boolean} force Determines if operations must override existing data.
 * @property {Path.Formats} pathFormat The format for any paths returned.
 * @property {Path.Types} pathType The type of paths to process.
 */
export interface PartialOptions {
  separator?: string,
  enableSpecialParts?: boolean,
  specialParts?: {
    [part: string]: Path.Part
  },
  exclude?: Function[],
  force?: boolean,
  pathFormat?: Path.Formats,
  pathType?: Path.Types
}

/**
 * Full options.
 * @interface
 * @see PartialOptions
 */
interface Options {
  separator: string,
  enableSpecialParts: boolean,
  specialParts: {
    [part: string]: Path.Part
  },
  exclude: Function[],
  force: boolean,
  pathFormat: Path.Formats,
  pathType: Path.Types
}

namespace Helper {
  /**
   * Determines if a value is excluded by the options.
   * @param {*} value The value to test.
   * @param {PartialOptions} opts
   * @returns {boolean}
   */
  export function isInstanceExcluded (
    value: any,
    opts: PartialOptions
  ): boolean {
    const options = Object.assign({}, OPTIONS, opts)

    return options.exclude.some(excludedClass => value instanceof excludedClass)
  }
}

/**
 * @typedef {string|Array<Path.Part>} Path
 */
export type Path = string | Path.Part[]

export namespace Path {
  /**
   * Key types (for values computed from RegExp for example).
   * @typedef {string|number} Key
   */
  export type Key = string | number // | symbol
  /**
   * @typedef {Key|RegExp} Part
   */
  export type Part = Key | RegExp

  /**
   * Available formats for a path.
   * @see Path
   */
  export enum Formats {
    String,
    Array
  }

  /**
   * Available types of paths. Leaf paths are paths with no children.
   */
  export enum Types {
    Any,
    Leaf
  }

  /**
   * Transforms a path to the desired format.
   * @param {Path} path The path to format.
   * @param {PartialOptions} opts
   * @returns {Path} The formatted path.
   * @throws {TypeError} A part is not compatible with the selected format.
   * @see Options
   */
  export function format (
    path: Path,
    opts?: PartialOptions
  ): Path {
    const options = Object.assign({}, OPTIONS, opts)

    // Path is in string format, splits it in array format for processing.
    if (typeof path === 'string') {
      return format(path.split(options.separator), options)
    }

    const parts = path
      .map(part => {
        if (typeof part === 'string') {
          // Replace the part by it's corresponding special part.
          if (
            options.enableSpecialParts &&
            options.specialParts.hasOwnProperty(part)
          ) {
            return options.specialParts[part]
          }
          // RegExp parts cannot be formatted with the string format.
        } else if (
          options.pathFormat === Formats.String && part instanceof RegExp
        ) {
          throw new TypeError('Provided path cannot be formatted as a string')
        }
        return part
      })

    if (options.pathFormat === Formats.String) {
      return parts.join(options.separator)
    } else {
      return parts
    }
  }

  /**
   * Returns the keys corresponding to part for an object. Useful to resolve
   * RegExp parts.
   * @param {Data} object
   * @param {Part} part
   * @param {PartialOptions} opts
   * @returns {Array<Key>} The list of keys.
   * @see Options
   */
  export function partMatchingKeys (
    object: Data,
    part: Part,
    opts?: PartialOptions
  ): Key[] {
    if (typeof object !== 'object') {
      return []
    }
    /**
     * @description Merges the provided options with the default options.
     * @implements {Options}
     */
    const options = Object.assign({}, OPTIONS, opts)
    /**
     * @description Duplicates the options and update them for internal computation.
     * @implements {Options}
     */
    const internalOptions = Object.assign(
      {},
      options,
      {
        pathFormat: Path.Formats.Array
      }
    )

    const fPart = format([part], internalOptions)[0]

    if (fPart instanceof RegExp) {
      return Object.keys(object).filter(key => {
        return fPart.test(key)
      })
    }

    if (object[fPart] !== undefined) {
      return [fPart]
    }

    return []
  }

  /**
   * Determines if one path is a parent of the other. RegExp parts are not
   * supported.
   *
   * @param {Path} path1 The first path
   * @param {Path} path2 The second path
   * @param {PartialOptions} opts
   * @returns {boolean} The result of the test
   * @see Options
   */
  export function arePathsRelated (
    path1: Path,
    path2: Path,
    opts?: PartialOptions
  ): boolean {
    const options = Object.assign({}, OPTIONS, opts)
    /**
     * @description Duplicates the options and update them for internal computation.
     * @implements {Options}
     */
    const internalOptions = Object.assign(
      {},
      options,
      {
        pathFormat: Path.Formats.Array
      }
    )
    const fPath1 = <Path.Part[]>Path.format(path1, internalOptions)
    const fPath2 = <Path.Part[]>Path.format(path2, internalOptions)

    const minLength = Math.min(fPath1.length, fPath2.length)
    for (let i = 0; i < minLength; i++) {
      if (fPath1[i] instanceof RegExp) {
        if (fPath2[i] instanceof RegExp) {
          throw new Error('Cannot check relation with RegExp parts')
        }
        if (!(<RegExp>fPath1[i]).test(fPath2[i].toString())) {
          return false
        }
        continue
      }
      if (fPath2[i] instanceof RegExp) {
        // fPath1[i] cannot be a RegExp.
        if (!(<RegExp>fPath2[i]).test(fPath1[i].toString())) {
          return false
        }
        continue
      }
      if (fPath1[i] !== fPath2[i]) {
        return false
      }
    }
    return true
  }

  export function isPathContainingRegExp (path: Path, opts?: PartialOptions): boolean {
    const options = Object.assign({}, OPTIONS, opts)
    /**
     * @description Duplicates the options and update them for internal computation.
     * @implements {Options}
     */
    const internalOptions = Object.assign(
      {},
      options,
      {
        pathFormat: Path.Formats.Array
      }
    )
    const fPath = <Path.Part[]>Path.format(path, internalOptions)
    return fPath.some(value => value instanceof RegExp)
  }
}

/**
 * Default options.
 * @implements {Options}
 * @see Options
 */
const OPTIONS: Options = {
  separator: '.',
  enableSpecialParts: false,
  specialParts: {
    '*': new RegExp('^.*$')
  },
  exclude: [],
  force: false,
  pathFormat: Path.Formats.String,
  pathType: Path.Types.Any
}

/**
 * Computes options and corresponding keys, formats the path and extract the
 * current part. Used in main functions.
 * @param {Data} object
 * @param {Path} path
 * @param {PartialOptions} opts
 * @returns {object} The computed variables.
 * @see Options
 */
function init (
  object: Data,
  path: Path,
  opts?: PartialOptions
): {
  options: Options,
  internalOptions: Options,
  childPath: Path.Part[],
  part: Path.Part,
  keys: Path.Key[]
} {
  /**
   * @description Merges the provided options with the default options.
   */
  const options = Object.assign({}, OPTIONS, opts)
  /**
   * @description Duplicates the options and update them for internal computation.
   */
  const internalOptions = Object.assign(
    {},
    options,
    {
      pathFormat: Path.Formats.Array
    }
  )
  /**
   * @description Formats the provided path.
   */
  const fPath = <Path.Part[]>Path.format(path, internalOptions).slice()
  /**
   * @description Extracts the current part. The formatted path contains now the child parts.
   */
  const part = <Path.Part>fPath.shift()
  /**
   * @description Computes the corresponding keys for the current part.
   */
  const keys = Path.partMatchingKeys(object, part, options)

  return {
    options,
    internalOptions,
    childPath: fPath,
    part,
    keys
  }
}

/**
 * Determines if a path exists in an object.
 * @param {Data} object
 * @param {Path} path
 * @param {PartialOptions} opts
 * @returns {boolean}
 * @see Options
 */
export function exists (
  object: Data,
  path: Path,
  opts?: PartialOptions
): boolean {
  const {
    options,
    internalOptions,
    childPath,
    part,
    keys
  } = init(object, path, opts)

  if (childPath.length === 0) {
    return keys.length > 0
  } else {
    let result = false
    for (const key of keys) {
      if (
        !Helper.isInstanceExcluded(object[key], internalOptions) &&
        exists(object[key], childPath, options)
      ) {
        result = true
        break
      }
    }

    return result
  }
}

/**
 * Returns an array of the values corresponding to the path in an object. If no
 * values are found returns a default value if defined (in an array).
 * @param {Data} object
 * @param {Path} path
 * @param {PartialOptions} opts
 * @param {*} defaultVal If defined this value is returned instead of an error.
 * @returns {Array} The list of the values.
 * @throws {UndefinedPropertyError} No values were found.
 * @see Options
 */
export function get (
  object: Data,
  path: Path,
  opts?: PartialOptions,
  defaultVal?: any,
): any[] {
  const {
    options,
    internalOptions,
    childPath,
    part,
    keys
  } = init(object, path, opts)

  /**
   * @description Contains all the values, even the children's (the result is flatten).
   */
  const result = []
  for (const key of keys) {
    // Last part of the path.
    if (childPath.length === 0) {
      result.push(object[key])
    } else if (!Helper.isInstanceExcluded(object[key], internalOptions)) {
      let subResult = []
      try {
        subResult = get(object[key], childPath, options)
      } catch (error) {
        // Catches errors from the recursive 'last part of the path' call.
        if (!(error instanceof UndefinedPropertyError)) {
          throw error
        }
      }

      if (subResult.length !== 0) {
        result.push(...subResult)
      }
    }
  }

  if (result.length === 0) {
    if (defaultVal !== undefined) {
      return [defaultVal]
    } else {
      throw new UndefinedPropertyError(part)
    }
  } else {
    return result
  }
}

/**
 * Sets a value in an object. Missing properties are created if `force` option
 * is enabled excepted for excluded objects. If no values can be set during the
 * operation, an error is thrown.
 * @param {Data} object
 * @param {Path} path
 * @param {*} value The value to place.
 * @param {PartialOptions} opts
 * @throws {TypeError} The given part cannot be used to create an undefined property.
 * @throws {UndefinedPropertyError} The given object cannot have additional properties.
 * @see Options
 */
export function put (
  object: Data,
  path: Path,
  value: any,
  opts?: PartialOptions
) {
  if (typeof object !== 'object') {
    throw new TypeError('Provided object cannot have properties updated')
  }
  const {
    options,
    internalOptions,
    childPath,
    part,
    keys
  } = init(object, path, opts)

  // No existing keys were found for the current part, tries to create a new
  // one.
  if (keys.length === 0 && options.force) {
    if (typeof part !== 'string') {
      throw new TypeError(
        `Part ${part} cannot be used to create undefined properties`
      )
    }

    object[part] = new Object()
    keys.push(part)
  }

  let success = false
  for (const key of keys) {
    // Last part of the path.
    if (childPath.length === 0) {
      object[key] = value
      success = true
    } else if (!Helper.isInstanceExcluded(object[key], internalOptions)) {
      try {
        put(object[key], childPath, value, options)
        success = true
      } catch (error) {
        // Catches errors from the recursive 'last part of the path' call.
        if (
          !(error instanceof TypeError ||
            error instanceof UndefinedPropertyError)
        ) {
          throw error
        }
      }
    }
  }

  if (!success) {
    throw new UndefinedPropertyError(part)
  }
}

/**
 * Deletes the matching keys in an object.
 * @param {Data} object
 * @param {Path} path
 * @param {PartialOptions} opts
 * @throws {UndefinedPropertyError} The path doesn't lead to any deletable properties.
 * @see Options
 */
export function remove (object: Data, path: Path, opts?: PartialOptions) {
  const {
    options,
    internalOptions,
    childPath,
    part,
    keys
  } = init(object, path, opts)

  if (keys.length === 0) {
    throw new UndefinedPropertyError(part)
  }

  let success = false
  for (const key of keys) {
    // Last part of the path
    if (childPath.length === 0) {
      delete object[key]
      success = true
    } else if (!Helper.isInstanceExcluded(object[key], internalOptions)) {
      try {
        remove(object[key], childPath, options)
        success = true
      } catch (error) {
        // Catches errors from the recursive 'last part of the path' call.
        if (!(error instanceof UndefinedPropertyError)) {
          throw error
        }
      }
    }
  }

  if (!success) {
    throw new UndefinedPropertyError(part)
  }
}

/**
 * Returns the list of available paths for an abject.
 * @param {Data} object
 * @param {PartialOptions} opts
 * @returns {Array<Path>}
 * @see Options
 */
export function paths (object: Data, opts?: PartialOptions): Path[] {
  /**
   * @description Merges the provided options with the default options.
   * @implements {Options}
   */
  const options = Object.assign({}, OPTIONS, opts)
  const result: string[] = []

  if (typeof object !== 'object') {
    return []
  }

  for (const key of Object.keys(object)) {
    const subKeys: Path[] = []

    if (
      typeof object[key] === 'object' &&
      !Helper.isInstanceExcluded(object[key], options)
    ) {
      subKeys.push(...paths(object[key], options))
    }

    if (
      options.pathType === Path.Types.Any ||
      (subKeys.length === 0 && options.pathType === Path.Types.Leaf)
    ) {
      result.push(key)
    }

    for (const subKey of subKeys) {
      result.push(key + options.separator + subKey)
    }
  }

  return result
}

export default class DotT {
  /**
   * Options passed to each call.
   * @implements {Options}
   * @readonly
   * @private
   */
  private readonly options: Options
  /**
   * The object the instance works on.
   * @implements {Data}
   * @readonly
   * @private
   */
  private readonly object: Data

  /**
   * Creates a DotT object. DotT objects are simple wrappers for the main DotT
   * functions.
   * @param {Data} object
   * @param {PartialOptions} opts
   * @see Options
   */
  constructor (object?: Data, opts?: PartialOptions) {
    // Merges the provided options with the default options.
    this.options = Object.assign({}, OPTIONS, opts)
    this.object = object || new Object()
  }

  /**
   * Access the object.
   */
  get value () {
    return this.object
  }

  /**
   * @see exists
   */
  exists (path: Path): boolean {
    return exists(this.object, path)
  }

  /**
   * @see get
   */
  get (path: Path, defaultVal?: any): any {
    return get(this.object, path, this.options, defaultVal)
  }

  /**
   * @returns {DotT} Self
   * @see put
   */
  put (path: Path, value: any): DotT {
    put(this.object, path, value, this.options)
    return this
  }

  /**
   * @returns {DotT} Self
   * @see remove
   */
  remove (path: Path): DotT {
    remove(this.object, path, this.options)
    return this
  }

  /**
   * @see paths
   */
  paths (): Path[] {
    return paths(this.object, this.options)
  }
}
