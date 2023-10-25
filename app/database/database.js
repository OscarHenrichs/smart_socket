const pg = require("pg");
const moment = require("moment-timezone");
const chalk = require("chalk");
const warning = chalk.hex("#FFA500");

var pool = null;

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

setUpNewPool = async () => {
	pool = new pg.Pool(config);
	// pool.on("connect", (client) => {
	//   let currentDatetime = moment()
	//     .tz("America/Sao_paulo")
	//     .format("DD-MM-YYYY HH:mm:ss");
	//   if(pool.totalCount >= 10){
	//     console.log(chalk.red(`${currentDatetime} => Pool:connect | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`))
	//   }else if (pool.totalCount > 5 && pool.totalCount < 10) {
	//     console.log(warning(
	//       `${currentDatetime} => Pool:connect | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ))
	//   }else {
	//     console.log(chalk.green(
	//       `${currentDatetime} => Pool:connect | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ));
	//   }
	// });

	// pool.on("acquire", async (client) => {
	//   let currentDatetime = moment()
	//     .tz("America/Sao_paulo")
	//     .format("DD-MM-YYYY HH:mm:ss");
	//   if(pool.totalCount >= 10){
	//     console.log(chalk.red(`${currentDatetime} => Pool:acquire | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`))
	//   }else if (pool.totalCount > 5 && pool.totalCount < 10) {
	//     console.log(warning(
	//       `${currentDatetime} => Pool:acquire | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ))
	//   }else {
	//     console.log(chalk.green(
	//       `${currentDatetime} => Pool:acquire | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ));
	//   }
	// });

	// pool.on("release", (err, client) => {
	//   let currentDatetime = moment()
	//     .tz("America/Sao_paulo")
	//     .format("DD-MM-YYYY HH:mm:ss");
	//   if(pool.totalCount >= 10){
	//     console.log(chalk.red(`${currentDatetime} => Pool:release | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`))
	//   }else if (pool.totalCount > 5 && pool.totalCount < 10) {
	//     console.log(warning(
	//       `${currentDatetime} => Pool:release | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ))
	//   }else {
	//     console.log(chalk.green(
	//       `${currentDatetime} => Pool:release | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ));
	//   }
	// });
	// pool.on("error", (err) => {
	//   let currentDatetime = moment()
	//     .tz("America/Sao_paulo")
	//     .format("DD-MM-YYYY HH:mm:ss");
	//   if(pool.totalCount >= 10){
	//     console.log(chalk.red(`${currentDatetime} => Pool:error | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`))
	//   }else if (pool.totalCount > 5 && pool.totalCount < 10) {
	//     console.log(warning(
	//       `${currentDatetime} => Pool:error | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ))
	//   }else {
	//     console.log(chalk.green(
	//       `${currentDatetime} => Pool:error | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`
	//     ));
	//   }
	//   process.exit(-1);
	// });

	pool.on("remove", (client) => {
		let currentDatetime = moment().tz("America/Sao_paulo").format("DD-MM-YYYY HH:mm:ss");
		if (pool.totalCount >= 10) {
			console.log(chalk.red(`${currentDatetime} => Pool:remove | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`));
		} else if (pool.totalCount > 5 && pool.totalCount < 10) {
			console.log(warning(`${currentDatetime} => Pool:remove | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`));
		} else {
			console.log(chalk.green(`${currentDatetime} => Pool:remove | Total: ${pool.totalCount}  | Ociosa: ${pool.idleCount} | Max: ${config.max}`));
		}
	});
};

module.exports = () => {
	const database = {};

	//! *************************************************************************
	//? getConnection
	//! *************************************************************************
	database.getConnection = async () => {
		pg.defaults.parseInputDatesAsUTC = true;
		pg.types.setTypeParser(pg.types.builtins.DATE, (str) => str);
		pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (str) => str);
		pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (str) => str);

		if (!pool || pool.totalCount > config.max - 2) {
			if (pool) {
				pool.end();
				pool = null;
			}
			await setUpNewPool();
		}

		// if (pool) {
		//   let currentDatetime = moment()
		//     .tz("America/Sao_paulo")
		//     .format("DD-MM-YYYY HH:mm:ss");
		//   console.log(
		//     `${currentDatetime} => getConnection | Total: ${pool.totalCount} | Max: ${config.max}`
		//   );
		// }

		return new Promise((resolve, reject) => {
			if (!pool) {
				reject({
					error: "Não foi possível estabelecer uma conexão com o banco de dados.",
				});
			} else {
				resolve(pool);
			}
		});
	};
	return database;
};
