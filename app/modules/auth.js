const jwt = require("jsonwebtoken");
const moment = require("moment");
const constants = require("../config/constants.js");
require("dotenv-safe").config({ allowEmptyValues: true });

const decodeJWT = (token, database) => {
	return new Promise(async (resolve, reject) => {
		let pool = await database.getConnection();
		pool.connect(function (err, client, done) {
			if (err) {
				client.release(true);
				console.log("Error connecting to pg server" + err.stack);
				return resolve({ auth: false, error: err });
			}
			if (!token) {
				client.release(true);
				console.log("Error token not found");
				return reject({ auth: false, error: "tokenNotFound" });
			}
			token = token.replace("Bearer ", "");
			let secret = process.env.TOKEN_SECRET;
			jwt.verify(token, secret, async function (err, decoded) {
				if (err) {
					console.log("Error token invalid");
					return resolve({ auth: false, error: "tokenInvalid" });
				}
				let currentDateTime = new Date();
				const expiresAt = decoded.expiresAt;
				let expireDate = moment(expiresAt * 1000).toDate();
				if (currentDateTime > expireDate) {
					client.release(true);
					return resolve({ auth: false, error: "tokenExpired" });
				}
				if (decoded.user_id == undefined) {
					client.release(true);
					return resolve({ auth: false, error: "tokenInvalid" });
				}

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
					client.release(true);
					return resolve({ auth: false, error: "tokenInvalid" });
				}
				return client
					.query(sql)
					.then(async (result) => {
						console.log("result.rows", result.rows);
						client.release(true);
						if (result.rows.length == 0) {
							resolve({ auth: false, error: "authFailed" });
						}
						resolve(decoded.user_id);
					})
					.catch(async (err) => {
						client.release(true);
						resolve({ auth: false, error: err });
					});
			});
		});
	});
};

module.exports = decodeJWT;
