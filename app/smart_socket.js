const decodeJWT = require("./modules/auth.js");
require("uWebSockets.js")
	.SSLApp({
		key_file_name: "./misc/key.pem",
		cert_file_name: "./misc/cert.pem",
	})
	.ws("/task/location", {
		idleTimeout: 60,
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
			const topic = `broadcast/project_${userData.project_id}/task_${userData.task_id}`;
			console.log("open", topic);
			ws.subscribe("broadcast");
		},
		message: (ws, message, isBinary) => {
			const userData = ws.getUserData();
			const topic = `broadcast/project_${userData.project_id}/task_${userData.task_id}`;
			ws.publish("broadcast", message, isBinary);
		},
		drain: (ws) => {},
		close: (ws, code, message) => {
			/* The library guarantees proper unsubscription at close */
		},
	})
	.ws("/broadcast", {
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

				return res.upgrade({ user_id: res.user, task_id: 233, project_id: 33 }, key, protocol, extensions, context);
			} catch {
				return res
					.cork(() => {
						res.writeStatus("401").write(JSON.stringify({ error: "Unauthorized" }));
					})
					.endWithoutBody();
			}
		},
		open: (ws) => {
			console.log("open");
			ws.subscribe("broadcast/#");

			ws.getTopics().forEach((topic) => {
				console.log("open A", topic);
				ws.subscribe(topic);
			});
		},
		drain: (ws) => {},
		close: (ws, code, message) => {
			/* The library guarantees proper unsubscription at close */
		},
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
