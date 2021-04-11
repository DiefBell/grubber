import Rule, { MatchRule } from "./Rule"
import Fragment from "./Fragment"

export type FromTo = {
	from: string | RegExp
	to: string | RegExp
}

export default class Parser {
	private stopExpressionCache = new Map<Rule, RegExp>()

	constructor(public content: string, public rules: Rule[]) {}

	find(...expressions: Array<string | RegExp>): Fragment[] {
		const result: Fragment[] = []
		const rules: Rule[] = [
			...expressions.map(expression => ({ type: "match", expression } as Rule)),
			...this.rules,
		]
		this.parse(rules, fragment => result.push(fragment))
		console.log("RESULT:", result)
		return result
	}

	replace(...fromTos: FromTo[]): string {
		let result = ""
		let offset = 0
		const rules: Rule[] = [
			...fromTos.map(
				({ from, to }) =>
					({
						type: "match",
						expression: from,
						from: new RegExp(`^${from}$`),
						to,
					} as Rule)
			),
			...this.rules,
		]

		this.parse(rules, (fragment, rule) => {
			result += this.content.slice(offset, fragment.start)
			result += fragment.slice.replace(rule.from!, rule.to!)
			offset = fragment.end
		})
		result += this.content.slice(offset)
		console.log("RESULT:", result)
		return result
	}

	private parse(rules: Rule[], onMatch: (fragment: Fragment, rule: MatchRule) => any) {
		const nextMatch = this.getNextMatchExpression(rules)

		let match: RegExpExecArray | null
		while ((match = nextMatch.exec(this.content))) {
			const [rule, ruleMatch] = this.getMatchingRule(rules, match)
			const fragment = this.resolveFragment(rule, match, ruleMatch.slice(1))
			if (!fragment) {
				// the fragment has no end (good chances it is a syntax error)
				console.warn("No stop found for rule", rule)
				break
			}
			console.log("fragment:", fragment.slice)

			nextMatch.lastIndex = fragment.end
			if (rule.type == "match") onMatch(fragment, rule)
		}
	}

	private getRuleExpression(rule: Rule): string {
		const expression = "expression" in rule ? rule.expression : rule.startAt
		return typeof expression == "string" ? expression : expression.source
	}

	private getRuleStopExpression(rule: Rule): RegExp {
		let expression = this.stopExpressionCache.get(rule)
		if (expression) return expression
		if ("expression" in rule) throw `A standalone expression has no stop delimiter`
		expression = new RegExp(
			typeof rule.stopAt == "string" ? rule.stopAt : rule.stopAt.source,
			"gm"
		)
		this.stopExpressionCache.set(rule, expression)
		return expression
	}

	private getNextMatchExpression(rules: Rule[]): RegExp {
		return new RegExp(
			rules.map(rule => "(?:" + this.getRuleExpression(rule) + ")").join("|"),
			"gm"
		)
	}

	private getMatchingRule(
		rules: Rule[],
		match: RegExpExecArray
	): [Rule, RegExpMatchArray] {
		const [input] = match
		// console.log("Get matching rule of:", input)
		for (const rule of rules) {
			const ruleExpression = this.getRuleExpression(rule)
			const ruleMatch = input.match(ruleExpression)
			if (ruleMatch && ruleMatch.index == 0 && ruleMatch[0].length == input.length) {
				// console.log("Matching rule:", rule, ruleMatch)
				if ("expression" in rule) {
					if (rule.onExpressionMatch && !rule.onExpressionMatch(ruleMatch)) continue
				} else {
					if (rule.onStartMatch && !rule.onStartMatch(ruleMatch)) continue
				}
				return [rule, ruleMatch]
			}
		}
		throw `[getMatchingRule] No rule matched`
	}

	private resolveFragment(
		rule: Rule,
		match: RegExpMatchArray,
		groups: string[] = []
	): Fragment | null {
		const start = match.index as number
		const input = match[0]
		const offset = start + input.length

		if ("expression" in rule) return new Fragment(this.content, start, offset, groups)
		else {
			const nextStop = this.getRuleStopExpression(rule)
			nextStop.lastIndex = offset
			let stop: null | RegExpExecArray
			while ((stop = nextStop.exec(this.content))) {
				if (!rule.onStopMatch || rule.onStopMatch(stop)) {
					return new Fragment(this.content, start, stop.index + stop[0].length, groups)
				}
			}
			return null
		}
	}
}