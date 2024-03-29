import { groupByAsMap, rulesEqual } from "./utils.js";
import { AddedRules } from "./added_rules.js";
import { IO } from "../cli/io.js";
import { GrammarLookupResult } from "../shared/grammar_lookup_result.js";
import { SequenceRule } from "./rules/sequence_rule.js";
import { ConstantRule } from "./rules/constant_rule.js";
import { RegexRule } from "./rules/regex_rule.js";

export class Grammar {
    isInGnf: boolean = false;
    cache: Map<string, SequenceRule[]> | undefined = undefined;
    rules: Map<string, SequenceRule[]> = new Map<string, SequenceRule[]>();

    constructor (rules: SequenceRule[]) {
        this.rules = groupByAsMap(rules, rule => rule.name);
    }

    static of (rules: SequenceRule[]) {
        return new Grammar(rules);
    }

    computeIsInGnf(): boolean {
        let isRegexRule = (it: SequenceRule) => (it.rules[0] instanceof RegexRule);
        let isConstantRule = (it: SequenceRule) => (it.rules[0] instanceof ConstantRule);
        let result = this.allRules().find(it => !isConstantRule(it) && !isRegexRule(it));
        return result == undefined;
    }

    fillCache(): Grammar {
        this.cache = groupByAsMap(this.allRules(), rule => this.ruleHash(rule));
        this.isInGnf = this.computeIsInGnf();
        return this;
    }

    ruleHash(rule: SequenceRule): string {
        if (rule.rules[0] && rule.rules[0] instanceof ConstantRule) {
            return rule.name + '\n' + rule.rules[0].token;
        } else {
            return rule.name;
        }
    }

    getRuleByLookahead(key: string, lookahead: string): GrammarLookupResult {
        if (this.cache) {
            return GrammarLookupResult.of(
                this.cache.get(key + '\n' + lookahead) ?? [],
                this.cache.get(key) ?? [],
            )
        } else {
            return GrammarLookupResult.of(
                [],
                this.rules.get(key) ?? [],
            )
        }
    }

    getRule(key: string): SequenceRule[] {
        return this.rules.get(key) ?? new Array<SequenceRule>();
    }

    addRule(rule: SequenceRule) {
        let res = this.rules.get(rule.name) ?? [];
        if (!res.find( it => rulesEqual(it, rule))) {
            this.rules.set(rule.name, [...res, rule]);
        }
    }

    removeRule(rule: SequenceRule) {
        let res = this.rules.get(rule.name) ?? [];
        this.rules.set(rule.name, res.filter(it => it != rule));
    }

    findRule(predicate: (r: SequenceRule) => boolean): SequenceRule | undefined {
        return this.allRules().find(predicate);
    }

    allRules(): SequenceRule[] {
        let allValues: SequenceRule[] = [];
        for (const value of this.rules.values()) {
            allValues = allValues.concat(value);
        }
        return allValues;
    }

    flatMap(transform: (rule: SequenceRule) => Array<SequenceRule>): Grammar {
        let result: SequenceRule[][] = [];
        for (const rules of this.rules.values()) {
            result.push(rules.flatMap(transform))
        }
        return Grammar.of(result.flat())
    }

    bind(transform: (grammar: Grammar) => Grammar, io: IO | undefined): Grammar {
        let res = transform(this);
        let size = res.allRules().length;
        let gnf = res.isInGnf ? " and is in gnf." : "";
        if (io) {
            io.debug("Size of grammar after transformation is " + size + gnf);
        }
        return res;
    }

    transform(transform: (rule: SequenceRule) => AddedRules<SequenceRule[]>): Grammar {
        return this.flatMap(rule =>
            AddedRules.of(rule)
                .flatMap(transform)
                .flat()
        );
    }
}
