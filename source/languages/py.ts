import Language from "../Language"
import Rule from "../Rule"

export default class implements Language {
	static readonly importExpression = /^(?:(?:\bfrom +(.*?) +)?(\bimport) +(.*?)) *(?:\bas +(.*?))? *$/gm

	readonly rules: Rule[] = [
		{
			// multi line string
			expression: /"""((?:.|\s)*?)[^\\](?:\\\\)*"""/,
		},
		{
			// single quote string
			expression: /'.*?[^\\](?:\\\\)*'/,
		},
		{
			// double quote string
			expression: /".*?[^\\](?:\\\\)*"/,
		},
		{
			// comment
			expression: /#.*/,
		},
	]
}
