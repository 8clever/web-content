module.exports = {
	env: process.env.ENV || "dev",
	users: {
		admin: {
			_id: "1",
			login: "admin",
			password: process.env.ADMIN_PASSWORD || "admin"
		},
		"8clever": {
			_id: "2",
			login: "8clever",
			password: process.env.CLEVER_PASSWORD || "8clever"
		}
	},
	secret: process.env.SECRET || "secret"
};