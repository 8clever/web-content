let _ = require("lodash");

module.exports = ProjectApi;

ProjectApi.prototype = {
	addProject,
	getProjects
};

function ProjectApi (ctx) {
	this.ctx = ctx;
}

async function addProject (token, project) {
	this.ctx.api.essence.validate(project, "project");
	let collection = this.ctx.driver.openCollection("projects");
	await collection.insert(project);
}

async function getProjects (token, query) {
	let collection = this.ctx.driver.openCollection("projects");
	if (_.isEmpty(query))
		return collection.all();
	return collection.find({});
}

