module.exports = {
	mydb: {
		url: process.env.MYDB_URL,
		login: process.env.MYDB_LOGIN,
		password: process.env.MYDB_PASSWORD,
		dbName: "web-content"
	},
	users: {
		admin: {
			login: process.env.ADMIN_LOGIN || "admin",
			password: process.env.ADMIN_PASSWORD || "admin"
		}
	},
	secret: process.env.SECRET || "secret"
};