module.exports = {
	env: process.env.ENV || "dev",
	pouchdb: {
		protocol: process.env.POUCHDB_PROTOCOL,
		domain: process.env.POUCHDB_DOMAIN,
		port: process.env.POUCHDB_PORT,
		login: process.env.POUCHDB_LOGIN,
		password: process.env.POUCHDB_PASSWORD
	},
	users: {
		admin: {
			_id: "1",
			login: "admin",
			password: process.env.ADMIN_PASSWORD || "admin"
		},
		"8clever": {
			_id: "2",
			login: "8clever",
			password: process.env["8CLEVER_PASSWORD"] || "8clever"
		}
	},
	secret: process.env.SECRET || "secret"
};