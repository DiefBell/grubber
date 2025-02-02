import es from "./es.js"
import c from "./c.js"
import cpp from "./cpp.js"
import css from "./css.js"
import scss from "./scss.js"
import sass from "./sass.js"
import nim from "./nim.js"
import py from "./py.js"
import rs from "./rs.js"

const languages = {
	es,
	c,
	cpp,
	css,
	scss,
	sass,
	nim,
	py,
	rs,
}
export default languages
export type LanguageName = keyof typeof languages
