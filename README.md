### Motivation
This is a naive LL parser that takes an ebnf grammar, and a beginning of an expression as arguments, and produces possible completions. We use a strongly customized form of an ebnf grammar, tailored for human readability. Furthermore, the Parser allows overriding selected rules, so it is possible to use the same grammar as a documentation for the user, and then (in a slightly modified form) for actual autocompletion. 

This was written mainly for the UHK macro language. Originally I attempted to write it in a generic fashion, but some aspects of the UHK grammar soaked through, so if you want to use this... be prepared to either have to dive deep into the code (which however is not long - around 1000 lines), or to use our ebnf notation.

### Example

Simplified example of the actual UHK grammar:

```
import { ParserBuilder } from 'naive-autocompletion-parser'


let grammarText = `
BODY = COMMENT
BODY = [LABEL:] COMMAND [COMMENT]
COMMENT = //<comment>
COMMAND = [CONDITION|MODIFIER]* COMMAND
COMMAND = {exec|call|fork} MACRONAME
COMMAND = {pressKey|holdKey|tapKey|releaseKey} SHORTCUT
COMMAND = tapKeySeq [SHORTCUT]+
COMMAND = set module.MODULEID.navigationMode.LAYERID_BASIC NAVIGATION_MODE
COMMAND = set module.MODULEID.baseSpeed <speed multiplier part that always applies, 0-10.0 (FLOAT)>
COMMAND = set module.MODULEID.speed <speed multiplier part that is affected by xceleration, 0-10.0 (FLOAT)>
COMMAND = set module.MODULEID.xceleration <exponent 0-1.0 (FLOAT)>
CONDITION = {ifShift | ifAlt | ifCtrl | ifGui}
MODIFIER = final
MODIFIER = autoRepeat
MODIFIER = oneShot
LAYERID = {fn|mouse|mod|base|fn2|fn3|fn4|fn5|alt|shift|super|ctrl}|last|previous
LAYERID_BASIC = {fn|mouse|mod|base|fn2|fn3|fn4|fn5}
KEYMAPID = <abbrev>|last
VARIABLE_EXPANSION = $<variable name> | $<config value name> | $currentAddress | $thisKeyId | $queuedKeyId.<queue index (INT)> | $keyId.KEYID_ABBREV
EXPRESSION = (EXPRESSION) | INT | BOOL | FLOAT | VARIABLE_EXPANSION | EXPRESSION OPERATOR EXPRESSION | !EXPRESSION | min(EXPRESSION [, EXPRESSION]+) | max(EXPRESSION [, EXPRESSION]+)
PARENTHESSED_EXPRESSION = (EXPRESSION)
INT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]+ | -[0-9]+
BOOL = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | 0 | 1
FLOAT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]*.[0-9]+ | -FLOAT
VALUE = INT | BOOL | FLOAT
STRING = "<interpolated string>" | '<literal string>'
IDENTIFIER = [a-zA-Z0-9_]+
LABEL = <label (IDENTIFIER)>
NAVIGATION_MODE = cursor | scroll | caret | media | zoom | zoomPc | zoomMac | none
MODULEID = trackball | touchpad | trackpoint | keycluster
SCANCODE = CHAR | SCANCODE_ABBREV
MODMASK = [MODMASK]+ | [L|R]{S|C|A|G} | {p|r|h|t} | {s|i|o}
SHORTCUT = MODMASK- | MODMASK-SCANCODE | SCANCODE | MODMASK
CHAR = <any nonwhite char>
SCANCODE_ABBREV = enter | escape | backspace | tab | space | minusAndUnderscore | equalAndPlus | openingBracketAndOpeningBrace | closingBracketAndClosingBrace
MACRONAME = <macro name (IDENTIFIER)>
`;

let parser = new ParserBuilder()
    .setTokenizerRegex(tokenizerRegex)
    .addRule(grammarText)
    .overrideRuleWithConstantString("CODE_BLOCK", "{")
    .overrideRuleWithConstantString("COMMENT", "//<comment>")
    .overrideRuleWithRegex("COMMENT", "//.*")
    .overrideRule("BOOL", "PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | 0 | 1 | true | false")
    .overrideRule("FLOAT", "PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | /[-]?[0-9]*.[0-9]+/")
    .overrideRuleWithConstantString("FLOAT", "<[-]?[0-9]*.[0-9]+>")
    .overrideRule("INT", "PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | /[-]?[0-9]+/")
    .overrideRuleWithConstantString("INT", "<[-]?[0-9]+>")
    .overrideRuleWithConstantString("STRING", "\"<interpolated string>\"")
    .overrideRuleWithConstantString("STRING", "'<literal string>'")
    .overrideRuleWithRegex("IDENTIFIER", '[a-zA-Z0-9_]*')
    .overrideRuleWithConstantString("IDENTIFIER", "<[a-zA-Z0-9_]*>")
    .build();

let res = parser.complete("set module.trackp", "BODY"); // [ { "suggestion": "trackpoint", "overlap": 6 } ]
console.log("Suggested completion: " + res[0].suggestion.substring(res[0].overlap) + ", overlapping with the original expression by " + res[0].overlap " chars.");
```

### Operators

feature | syntax
 --- | ---
 rules / nonterminals | `UPPERCASE_IDENTIFIERS`
 obligatory group | `{ ... }`
 optional group | `[ ... ]`
 repeat once or more | `[ ... ]+`
 repeat arbitrary | `[ ... ]*`
 choice | `A \| B`
 terminal as regex | `/regex/`
 terminal as string | `text`
 human-readable hint | `<hint>`
 human-readable hint, backed by a specific rule | `<hint (RULE)>`

### Repl environment.

Furthermore, the project has a REPL environment that has some commands for debug of the grammar. E.g., a it provides a walker that allows you to expand the rule step by step, picking expansions one by one. It can be started by:

```
import { Cli } from 'naive-autocompletion-parser'

Cli.launch(parser);
```

### Efficiency

Acceptable on small and unambiguous grammars that don't require deep expansions of left-recursive rules. (For convenience a rule can expand to itself, but is never allowed to be expanded multiple times on the same path unless some token was matched along the path.) On ambiguous grammars, poor performance is to be expected.

Also, we do not transform the grammar into normal forms and yet prevent infinite left recursion, so nothing prevents you from shootin yourself in your foot. (Hey, the word "naive" is right in the name!)

### Usage

We provide a vscode configuration. 

From commandline, you can:

```
git clone https://github.com/kareltucek/naive-autocompletion-parser.git
cd naive-autocompletion-parser
tsc                              # compile the project
node dist/uhk_preset.js start    # start the repl
```

Or from your project you can:

```
npm install naive-autocompletion-parser
```

and then

```
import { ParserBuilder, Cli, startUhkCli } from 'naive-autocompletion-parser'
```