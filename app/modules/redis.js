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

module.exports = { client, redisConnect, storeRedisData };
