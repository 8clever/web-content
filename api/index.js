let ProjectApi = require("./lib/projectapi");
let EssenceApi = require("./lib/essenceapi");
let Authorize = require("./lib/authorizeapi");
let Image = require("./lib/imageapi");
let Category = require("./lib/categoryapi");

module.exports = function(ctx) {
	return {
		project: new ProjectApi(ctx),
		essence: new EssenceApi(ctx),
		authorize: new Authorize(ctx),
		image: new Image(ctx),
		category: new Category(ctx)
	}
};
