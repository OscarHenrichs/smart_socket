const { createClient } = require("redis");

const client = createClient();

const redisConnect = async () => {
	client.on("error", (error) => console.log("Redis Client Error", error));

	await client.connect();
};

const storeRedisData = async (data, req, ex = null) => {
	try {
		await client.set(`${req.url}`, JSON.stringify(data), {
			EX: ex,
			NX: true,
		});
	} catch (error) {
		console.log(error);
	}
};

const storeBroadcastRoom = async (room) => {
	try {
		await client.sAdd("room", room);
	} catch (error) {
		console.log(error);
	}
};

const removeBroadcastRoom = async (room) => {
	try {
		await client.sRem("room", room);
	} catch (error) {
		console.log(error);
	}
};

const getBroadcastRoom = async () => {
	try {
		await client.sMembers("room");
	} catch (error) {
		console.log(error);
	}
};

module.exports = { client, redisConnect, storeRedisData, storeBroadcastRoom, removeBroadcastRoom, getBroadcastRoom };
