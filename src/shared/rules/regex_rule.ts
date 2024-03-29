import { StringPathResult } from "./string_path_result.js";
import { IO } from "../../cli/io.js";
import { MatchResult } from "../../parsing/match_results.js";
import { PointerStack } from "../../parsing/pointers.js";
import { Grammar } from "../grammar.js";
import { markPointersAsConsumed, tryConvertRegexToConstant } from "../utils.js";
import { Rule } from "./rule_interface.js";
import { ConstantRule } from "./constant_rule.js";


export class RegexRule implements Rule {
    regex: RegExp;

    constructor(r: RegExp) {
        let modified = r.source.replace(new RegExp('^\\^'), '');
        this.regex = new RegExp(`^.${modified}`);
    }

    static from(r: RegExp, originRule: string): Rule {
        let maybeConstantString = tryConvertRegexToConstant(r);
        if (maybeConstantString) {
            return new ConstantRule(maybeConstantString, originRule);
        } else {
            return new RegexRule(r);
        }
    }

    toString(): string {
        return this.regex.toString() 
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        let res = expression.match(this.regex)
        if (res) {
            // pop me from stack and increment string position
            let newStack = pointer.stack.slice(0, pointer.stack.length - 1);
            let markedStack = markPointersAsConsumed(newStack);
            let newPointer = new PointerStack(markedStack, pointer.stringPosition + res[0].length - 1);
            return new MatchResult([newPointer], [], []);
        } else {
            return new MatchResult([], [], [pointer]);
        }
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return consumedSomething;
    }
}
