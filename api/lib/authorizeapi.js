Authorize.prototype = {
	add,
	check,
	rm,
	get
};

function Authorize (ctx) {
	this.ctx = ctx;
}

async function add (session) {
	this.ctx.api.essence.validate(session, "session");
	let sessExists = await this.check(session.id);
	let sessionCol = this.ctx.driver.openCollection("session");
	if (sessExists) throw new Error("Session already authorized.");
	await sessionCol.post(session);
}

async function check (id) {
	let sess = await this.get(id);
	return sess && true || false;
}

async function rm (id) {
	let sess = await this.get(id);
	let sessCol = this.ctx.driver.openCollection("session");
	if (!sess) return;
	await sessCol.remove(sess);
}

async function get (id) {
	let sessionCol = this.ctx.driver.openCollection("session");
	let { docs } = await sessionCol.find({
		selector: { id },
		fields: [ "user", "_id", "_rev" ]
	});
	return docs[0] || null;
}

module.exports = Authorize;