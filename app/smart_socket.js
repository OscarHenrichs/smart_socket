const constants = require("./config/constants.js");
const decodeJWT = require("./modules/auth.js");
const crypto = require("./modules/crypto.js");

const { redisConnect, storeBroadcastRoom, removeBroadcastRoom, getBroadcastRoom } = require("./modules/redis.js");

require("uWebSockets.js")
	.App()
	.ws("/app/task/:task_id/:execution_uuid/:auth", {
		idleTimeout: 120,
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
				const taskId = req.getParameter(0);
				const executionUuid = req.getParameter(1);
				const auth = req.getParameter(2);

				res.user = await decodeJWT(auth, database);

				if (res.aborted) {
					return;
				}

				if (res.user.auth != undefined) {
					return res
						.cork(() => {
							res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized A" }));
						})
						.endWithoutBody();
				}

				return res.upgrade({ user_id: res.user, task_id: taskId, execution_uuid: executionUuid }, key, protocol, extensions, context);
			} catch {
				return res
					.cork(() => {
						res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized B" }));
					})
					.endWithoutBody();
			}
		},
		open: (ws) => {
			const userData = ws.getUserData();
			ws.subscribe(`${constants.broadCastTask}/${userData.taskId}`);
			ws.subscribe(`${constants.broadCastUser}/${userData.user_id}`);
		},
		message: (ws, message, isBinary) => {
			const userData = ws.getUserData();
			ws.publish(`${constants.broadCastTask}/${userData.taskId}`, message, isBinary);
			ws.publish(`${constants.broadCastUser}/${userData.user_id}`, message, isBinary);
		},
		drain: (ws) => {},
		close: (ws, code, message) => {
			const userData = ws.getUserData();
			ws.unsubscribe(`${constants.broadCastProject}/${userData.project_id}`);
			ws.unsubscribe(`${constants.broadCastTask}/${userData.task_id}`);
			ws.unsubscribe(`${constants.broadCastUser}/${userData.user_id}`);
		},
	})
	.ws("/broadcast/user/:user_id", {
		idleTimeout: 0,
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
				const userId = req.getParameter(0);
				res.user = await decodeJWT(token, database);

				if (res.aborted) {
					return;
				}

				if (res.user.auth != undefined) {
					return res
						.cork(() => {
							res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized" }));
						})
						.endWithoutBody();
				}

				return res.upgrade({ user_id: userId }, key, protocol, extensions, context);
			} catch {
				return res
					.cork(() => {
						res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized" }));
					})
					.endWithoutBody();
			}
		},
		open: async (ws) => {
			const userData = ws.getUserData();
			ws.subscribe(`broadcast/user/${userData.user_id}`);
		},
		drain: (ws) => {},
		close: (ws, code, message) => {},
	})
	.ws("/broadcast/task/:task_id", {
		idleTimeout: 0,
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
				const taskId = req.getParameter(0);
				res.user = await decodeJWT(token, database);

				if (res.aborted) {
					return;
				}

				if (res.user.auth != undefined) {
					return res
						.cork(() => {
							res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized A" }));
						})
						.endWithoutBody();
				}

				return res.upgrade({ task_id: taskId }, key, protocol, extensions, context);
			} catch {
				return res
					.cork(() => {
						res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized B" }));
					})
					.endWithoutBody();
			}
		},
		open: async (ws) => {
			const userData = ws.getUserData();
			ws.subscribe(`broadcast/task/${userData.task_id}`);
		},
		message: (ws, message, isBinary) => {
			const userData = ws.getUserData();
			ws.publish(`broadcast/task/${userData.task_id}`, message, isBinary);
		},
		drain: (ws) => {},
		close: (ws, code, message) => {},
	})
	.any("/*", (res, req) => {
		res.cork(() => {
			res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized" }));
		}).endWithoutBody();
	})
	.listen(9001, (listenSocket) => {
		if (listenSocket) {
			console.log("Listening to port 9001");
		}
	});
