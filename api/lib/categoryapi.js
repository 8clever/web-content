Category.prototype = {
	add,
	rm,
	get
};
module.exports = Category;

function Category (ctx) {
	this.ctx = ctx;
}

async function get (token, query) {
	let __category = this.ctx.driver.openCollection("category");
	let category = await __category.find({ selector: query });
	return category.docs;
}

async function add (token, category) {
	this.ctx.api.essence.validate(category, "category");
	let __category = this.ctx.driver.openCollection("category");
	if (!category._id) return __category.post(category);
	throw new Error ("Category without updated functions!");
}

async function rm (token, _idcategory) {
	let __category = this.ctx.driver.openCollection("category");
	let category = await __category.get(_idcategory);
	return __category.remove(category);
}