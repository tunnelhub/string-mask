export type MaskToken = {
  pattern?: RegExp;
  escape?: boolean;
  optional?: boolean;
  recursive?: boolean;
  transform?: (v: string) => string;
  defaultValue?: string;
};

const tokens: {
  [name: string]: MaskToken;
} = {
  "0": { pattern: /\d/, defaultValue: "0" },
  "9": { pattern: /\d/, optional: true },
  "#": { pattern: /\d/, optional: true, recursive: true },
  A: { pattern: /[a-zA-Z0-9]/ },
  S: { pattern: /[a-zA-Z]/ },
  U: {
    pattern: /[a-zA-Z]/,
    transform: function (c) {
      return c.toLocaleUpperCase();
    },
  },
  L: {
    pattern: /[a-zA-Z]/,
    transform: function (c) {
      return c.toLocaleLowerCase();
    },
  },
  $: { escape: true },
};

export type MaskOptions = {
  reverse?: boolean;
  usedefaults?: boolean;
};

export type MaskResult = {
  result: string;
  valid: boolean;
};

export class StringMask {
  private options: MaskOptions;

  static process(
    value: string | null | undefined,
    pattern: string,
    opt?: MaskOptions,
  ) {
    return new StringMask(pattern, opt).process(value);
  }

  static validate(
    value: string | null | undefined,
    pattern: string,
    opt?: MaskOptions,
  ) {
    return new StringMask(pattern, opt).validate(value);
  }

  static apply(
    value: string | null | undefined,
    pattern: string,
    opt?: MaskOptions,
  ) {
    return new StringMask(pattern, opt).apply(value);
  }

  constructor(
    private pattern: string,
    opt?: MaskOptions,
  ) {
    this.options = opt || {};
    this.options = {
      reverse: this.options.reverse || false,
      usedefaults: this.options.usedefaults || this.options.reverse,
    };
  }

  process(value: string | null | undefined): MaskResult {
    if (!value) {
      return { result: "", valid: false };
    }
    value = value + "";
    let pattern2 = this.pattern;
    let valid = true;
    let formatted = "";
    let valuePos = this.options.reverse ? value.length - 1 : 0;
    let patternPos = 0;
    let optionalNumbersToUse = calcOptionalNumbersToUse(pattern2, value);
    let escapeNext = false;
    let recursive = [];
    let inRecursiveMode = false;

    let steps = {
      start: this.options.reverse ? pattern2.length - 1 : 0,
      end: this.options.reverse ? -1 : pattern2.length,
      inc: this.options.reverse ? -1 : 1,
    };

    function continueCondition(options) {
      if (
        !inRecursiveMode &&
        !recursive.length &&
        hasMoreTokens(pattern2, patternPos, steps.inc)
      ) {
        // continue in the normal iteration
        return true;
      } else if (
        !inRecursiveMode &&
        recursive.length &&
        hasMoreRecursiveTokens(pattern2, patternPos, steps.inc)
      ) {
        // continue looking for the recursive tokens
        // Note: all chars in the patterns after the recursive portion will be handled as static string
        return true;
      } else if (!inRecursiveMode) {
        // start to handle the recursive portion of the pattern
        inRecursiveMode = recursive.length > 0;
      }

      if (inRecursiveMode) {
        let pc = recursive.shift();
        recursive.push(pc);
        if (options.reverse && valuePos >= 0) {
          ++patternPos;
          pattern2 = insertChar(pattern2, pc, patternPos);
          return true;
        } else if (!options.reverse && valuePos < value.length) {
          pattern2 = insertChar(pattern2, pc, patternPos);
          return true;
        }
      }
      return patternPos < pattern2.length && patternPos >= 0;
    }

    /**
     * Iterate over the pattern's chars parsing/matching the input value chars
     * until the end of the pattern. If the pattern ends with recursive chars
     * the iteration will continue until the end of the input value.
     *
     * Note: The iteration must stop if an invalid char is found.
     */
    for (
      patternPos = steps.start;
      continueCondition(this.options);
      patternPos = patternPos + steps.inc
    ) {
      // Value char
      let vc = value.charAt(valuePos);
      // Pattern char to match with the value char
      let pc = pattern2.charAt(patternPos);

      let token = tokens[pc];
      if (recursive.length && token && !token.recursive) {
        // In the recursive portion of the pattern: tokens not recursive must be seen as static chars
        token = null;
      }

      // 1. Handle escape tokens in pattern
      // go to next iteration: if the pattern char is a escape char or was escaped
      if (!inRecursiveMode || vc) {
        if (this.options.reverse && isEscaped(pattern2, patternPos)) {
          // pattern char is escaped, just add it and move on
          formatted = concatChar(formatted, pc, this.options, token);
          // skip escape token
          patternPos = patternPos + steps.inc;
          continue;
        } else if (!this.options.reverse && escapeNext) {
          // pattern char is escaped, just add it and move on
          formatted = concatChar(formatted, pc, this.options, token);
          escapeNext = false;
          continue;
        } else if (!this.options.reverse && token && token.escape) {
          // mark to escape the next pattern char
          escapeNext = true;
          continue;
        }
      }

      // 2. Handle recursive tokens in pattern
      // go to next iteration: if the value str is finished or
      //                       if there is a normal token in the recursive portion of the pattern
      if (!inRecursiveMode && token && token.recursive) {
        // save it to repeat in the end of the pattern and handle the value char now
        recursive.push(pc);
      } else if (inRecursiveMode && !vc) {
        // in recursive mode but value is finished. Add the pattern char if it is not a recursive token
        formatted = concatChar(formatted, pc, this.options, token);
        continue;
      } else if (!inRecursiveMode && recursive.length > 0 && !vc) {
        // recursiveMode not started but already in the recursive portion of the pattern
        continue;
      }

      // 3. Handle the value
      // break iterations: if value is invalid for the given pattern
      if (!token) {
        // add char of the pattern
        formatted = concatChar(formatted, pc, this.options, token);
        if (!inRecursiveMode && recursive.length) {
          // save it to repeat in the end of the pattern
          recursive.push(pc);
        }
      } else if (token.optional) {
        // if token is optional, only add the value char if it matchs the token pattern
        //                       if not, move on to the next pattern char
        if (token.pattern?.test?.(vc) && optionalNumbersToUse) {
          formatted = concatChar(formatted, vc, this.options, token);
          valuePos = valuePos + steps.inc;
          --optionalNumbersToUse;
        } else if (recursive.length > 0 && vc) {
          valid = false;
          break;
        }
      } else if (token.pattern?.test?.(vc)) {
        // if token isn't optional the value char must match the token pattern
        formatted = concatChar(formatted, vc, this.options, token);
        valuePos = valuePos + steps.inc;
      } else if (!vc && token.defaultValue && this.options.usedefaults) {
        // if the token isn't optional and has a default value, use it if the value is finished
        formatted = concatChar(
          formatted,
          token.defaultValue,
          this.options,
          token,
        );
      } else {
        // the string value don't match the given pattern
        valid = false;
        break;
      }
    }

    return { result: formatted, valid: valid };
  }

  apply(value: string | null | undefined) {
    return this.process(value).result;
  }

  validate(value: string | null | undefined) {
    return this.process(value).valid;
  }
}

function isEscaped(pattern: string, pos: number) {
  let count = 0;
  let i = pos - 1;
  let token: MaskToken = { escape: true };
  while (i >= 0 && token && token.escape) {
    token = tokens[pattern.charAt(i)];
    count += token && token.escape ? 1 : 0;
    --i;
  }
  return count > 0 && count % 2 === 1;
}

function calcOptionalNumbersToUse(pattern: string, value: string) {
  let numbersInP = pattern.replace(/[^0]/g, "").length;
  let numbersInV = value.replace(/[^\d]/g, "").length;
  return numbersInV - numbersInP;
}

function concatChar(
  text: string,
  character: string,
  options,
  token: MaskToken,
) {
  if (token && typeof token.transform === "function") {
    character = token.transform(character);
  }
  if (options.reverse) {
    return character + text;
  }
  return text + character;
}

function hasMoreTokens(pattern: string, pos: number, inc: number) {
  let pc = pattern.charAt(pos);
  let token = tokens[pc];
  if (pc === "") {
    return false;
  }
  return token && !token.escape ? true : hasMoreTokens(pattern, pos + inc, inc);
}

function hasMoreRecursiveTokens(pattern: string, pos: number, inc: number) {
  let pc = pattern.charAt(pos);
  let token = tokens[pc];
  if (pc === "") {
    return false;
  }
  return token && token.recursive
    ? true
    : hasMoreRecursiveTokens(pattern, pos + inc, inc);
}

function insertChar(text: string, char: string, position: number) {
  let t = text.split("");
  t.splice(position, 0, char);
  return t.join("");
}
