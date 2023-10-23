const app = require("uWebSockets.js").SSLApp({
	key_file_name: "misc/key.pem",
	cert_file_name: "misc/cert.pem",
});
const Pool = require("pg-pool");
const pg = require("pg");
const jwt = require("jsonwebtoken");
require("dotenv-safe").config({ allowEmptyValues: true });

app.ws("/", {
	idleTimeout: 32,
	maxBackpressure: 1024,
	maxPayloadLength: 512,
	upgrade: (res, req, context) => {
		console.log("An Htts connection wants to become WebSocket, URL: " + req.getUrl() + "!");
		try {
			obj = decodeJwtCookie(req);
		} catch {
			return res.writeStatus("401").end();
		}
		/* This immediately calls open handler, you must not use res after this call */
		res.upgrade(
			{
				myData: req.getUrl() /* First argument is UserData (see WebSocket.getUserData()) */,
			},
			/* Spell these correctly */
			req.getHeader("sec-websocket-key"),
			req.getHeader("sec-websocket-protocol"),
			req.getHeader("sec-websocket-extensions"),
			context
		);
	},
	/* There are many common helper features */

	/* For brevity we skip the other events (upgrade, open, ping, pong, close) */
	message: (ws, message, isBinary) => {
		/* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
		console.log(message);
		/* Here we echo the message back, using compression if available */
		let ok = ws.send(message, isBinary, true);
	},
});

function decodeJwtCookie(req, res) {
	let token = req.headers["authorization"];

	if (!token) {
		client.release(true);
		return res.status(401).send({ auth: false, error: req.__("tokenNotFound") });
	}
	token = token.replace("Bearer ", "");
	let secret = process.env.TOKEN_SECRET;
	jwt.verify(token, secret, async function (err, decoded) {
		if (err) {
			client.release(true);
			return { auth: false, error: "tokenInvalid" };
		}
		let currentDateTime = new Date();
		const expiresAt = decoded.expiresAt;
		let expireDate = moment(expiresAt * 1000).toDate();
		if (currentDateTime > expireDate) {
			client.release(true);
			return { auth: false, error: "tokenExpired" };
		}
		let sql = "";

		let userId = decoded.user_id;
		let callerId = decoded.caller;
		if (userId != undefined) {
			if (callerId == constants.tokenCallerApp) {
				sql = `SELECT user_id FROM users WHERE user_id = ${userId} AND user_token = '${token}'`;
			} else {
				sql = `SELECT user_id FROM users WHERE user_id = ${userId} AND user_web_token = '${token}'`;
			}
		} else {
			let adminId = decoded.admin_id;
			if (adminId != undefined) {
				sql = `SELECT admin_id FROM admin WHERE admin_id = ${adminId} AND admin_token = '${token}'`;
			}
		}

		if (sql.length == 0) {
			return { auth: false, error: "authFailed" };
		}
		global.client
			.query(sql)
			.then(async (result) => {
				client.release(true);
				if ((result.rows.length = 0)) {
					return { auth: false, error: "authFailed" };
				}
				next();
			})
			.catch(async (err) => {
				console.log(chalk.red("%s"), err);
				client.release(true);
				return { auth: false, error: "databaseError" };
			});
	});
	return { auth: true, user_id: userId };
}

const config = {
	user: process.env.PG_USER,
	host: process.env.PG_HOST,
	database: process.env.PG_DATABASE,
	password: process.env.PG_PASSWORD,
	port: process.env.PG_PORT,
	timezone: "America/Sao_paulo",
	max: process.env.PG_MAX_POOL_CONNECTION,
	connectionTimeoutMillis: 2000,
	idleTimeoutMillis: 2000,
	allowExitOnIdle: true,
};

(async () => {
	pg.defaults.parseInputDatesAsUTC = true;
	pg.types.setTypeParser(pg.types.builtins.DATE, (str) => str);
	pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (str) => str);
	pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (str) => str);
	var pool = new Pool(config);
	global.client = await pool.connect();
	try {
		app.listen(9001, (listenSocket) => {
			if (listenSocket) {
				console.log("Listening to port 9001");
			}
		});
	} finally {
		global.client.release();
	}
})().catch((e) => console.error(e.message, e.stack));
