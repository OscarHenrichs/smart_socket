const decodeJWT = require("./auth/auth.js");
require("uWebSockets.js")
	.SSLApp({
		key_file_name: "./misc/key.pem",
		cert_file_name: "./misc/cert.pem",
	})
	.ws("/", {
		idleTimeout: 32,
		maxBackpressure: 1024,
		maxPayloadLength: 512,
		upgrade: async (res, req, context) => {
			
			const database = require("./database/database.js")();
			res.onAborted(() => {
				res.aborted = true;
			});
			console.log("An Htts connection wants to become WebSocket, URL: " + req.getUrl() + "!");

			try {
				const key = req.getHeader("sec-websocket-key");
				const protocol = req.getHeader("sec-websocket-protocol");
				const extensions = req.getHeader("sec-websocket-extensions");
				const token = req.getHeader("authorization");
				res.user = await decodeJWT(token, database);

				if (res.aborted) {
					return;
				}

				if (res.user.auth != undefined) {
					return res
						.cork(() => {
							res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized" }));
						})
						.close();
				}

				return res.upgrade({ user_id: res.user }, key, protocol, extensions, context);
			} catch {
				return res
					.cork(() => {
						res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized" }));
					})
					.close();
			}
		},
		open: (ws) => console.log("open-ws", ws.uid),
		message: (ws, message, isBinary) => {
			let ok = ws.send(message, isBinary, true);
		},
	})
	.listen(9001, (listenSocket) => {
		if (listenSocket) {
			console.log("Listening to port 9001");
		}
	});
