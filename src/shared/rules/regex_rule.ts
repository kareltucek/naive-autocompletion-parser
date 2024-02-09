
import { IO } from "../../cli/io";
import { MatchResult } from "../../parsing/match_results";
import { Pointer, PointerStack } from "../../parsing/pointers";
import { strictIdentifierRegex } from "../constants";
import { Grammar } from "../grammar";
import { escapeRegex, markPointersAsConsumed } from "../utils";
import { IterationType } from "./iteration_type";
import { Rule } from "./rule_interface";
import { RuleRef } from "./rule_ref";

export class RegexRule implements Rule {
    regex: RegExp;

    constructor(r: RegExp) {
        let modified = r.source.replace(new RegExp('^\\^'), '');
        this.regex = new RegExp(`^.${modified}`);
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
