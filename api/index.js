let ProjectApi = require("./lib/projectapi");
let EssenceApi = require("./lib/essenceapi");
let Authorize = require("./lib/authorizeapi");

module.exports = function(ctx) {
	return {
		project: new ProjectApi(ctx),
		essence: new EssenceApi(ctx),
		authorize: new Authorize(ctx)
	}
};
