let ProjectApi = require("./lib/projectapi");
let EssenceApi = require("./lib/essenceapi");

module.exports = function(ctx) {
	return {
		project: new ProjectApi(ctx),
		essence: new EssenceApi()
	}
};
