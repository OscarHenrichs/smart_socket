const constants = require("./config/constants.js");
const decodeJWT = require("./modules/auth.js");
const { redisConnect, storeBroadcastRoom, removeBroadcastRoom, getBroadcastRoom } = require("./modules/redis.js");

require("uWebSockets.js")
	.SSLApp({
		cert_file_name: "../../etc/letsencrypt/live/dev.websocket.smartcitizen.tec.br/fullchain.pem",
		key_file_name: "../../etc/letsencrypt/live/dev.websocket.smartcitizen.tec.br/privkey.pem",
	})
	.ws("/", {
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
				const projectId = req.getParameter(0);
				const taskId = req.getParameter(1);
				console.log(projectId, taskId);
				const token = req.getHeader("authorization");

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

				return res.upgrade({ user_id: res.user, task_id: taskId, project_id: projectId }, key, protocol, extensions, context);
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
			ws.subscribe("test");
		},
		message: (ws, message, isBinary) => {
			const userData = ws.getUserData();
			ws.publish("test", message, isBinary);
		},
		drain: (ws) => {},
		close: (ws, code, message) => {
			ws.unsubscribe("test");
		},
	})
	.ws("/task/:project_id/:task_id", {
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
				const projectId = req.getParameter(0);
				const taskId = req.getParameter(1);
				console.log(projectId, taskId);
				const token = req.getHeader("authorization");

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

				return res.upgrade({ user_id: res.user, task_id: taskId, project_id: projectId }, key, protocol, extensions, context);
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
			ws.subscribe(`${constants.broadCastProject}/${userData.projectId}`);
			ws.subscribe(`${constants.broadCastTask}/${userData.taskId}`);
			ws.subscribe(`${constants.broadCastUser}/${userData.user_id}`);
		},
		message: (ws, message, isBinary) => {
			const userData = ws.getUserData();
			ws.publish(`${constants.broadCastProject}/${userData.project_id}`, message, isBinary);
			ws.publish(`${constants.broadCastTask}/${userData.task_id}`, message, isBinary);
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
	.ws("/broadcast/project/:project_id", {
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
				const projectId = req.getParameter(0);
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

				return res.upgrade({ project_id: projectId }, key, protocol, extensions, context);
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
			ws.subscribe(`broadcast/project/${userData.project_id}`);
		},
		message: (ws, message, isBinary) => {
			const userData = ws.getUserData();
			ws.publish(`broadcast/project/${userData.project_id}`, message, isBinary);
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
