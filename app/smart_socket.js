const app = require("uWebSockets.js").App({
	maxPayloadLength: 10 * 1024 * 1024 * 1024,
	key_file_name: "misc/key.pem",
	cert_file_name: "misc/cert.pem",
});
const Pool = require("pg-pool");
const pg = require("pg");
require("dotenv-safe").config({ allowEmptyValues: true });

app.ws("/", {
	idleTimeout: 32,
	maxBackpressure: 1024,
	maxPayloadLength: 512,
	open: async (socket, request) => {
		global.app = app;
	},
	upgrade: (res, req, context) => {
		console.log("An Htts connection wants to become WebSocket, URL: " + req.getUrl() + "!");
		try {
			res.user = decodeJwtCookie(req.getHeader("user_id"), req.getHeader("pass"), req.getHeader("login"));
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

function decodeJwtCookie(user_id, pass, login) {
	const userId = user_id;
	const pass_code = pass;
	const login_char = login;

	if (pass_code != 1234 || login_char != "smart") {
		throw new TypeError("Sem auth");
	}

	return userId;
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
	var client = await pool.connect();
	try {
		app.listen(9001, (listenSocket) => {
			if (listenSocket) {
				console.log("Listening to port 9001");
			}
		});
	} finally {
		client.release();
	}
})().catch((e) => console.error(e.message, e.stack));
