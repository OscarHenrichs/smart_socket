const crypto = require("crypto");
require("dotenv-safe").config({ allowEmptyValues: true });

const key = crypto.createHash("sha512").update(process.env.URL_SECRET).digest("hex").substring(0, 32);

const encryptionIV = crypto.createHash("sha512").update(process.env.ENCRYPT_SECRET).digest("hex").substring(0, 16);

export function encryptData(data) {
	const cipher = crypto.createCipheriv(ecnryption_method, key, encryptionIV);
	return Buffer.from(cipher.update(data, "utf8", "hex") + cipher.final("hex")).toString("base64"); // Encrypts data and converts to hex and base64
}

export function decryptData(encryptedData) {
	const buff = Buffer.from(encryptedData, "base64");
	const decipher = crypto.createDecipheriv(ecnryption_method, key, encryptionIV);
	return decipher.update(buff.toString("utf8"), "hex", "utf8") + decipher.final("utf8"); // Decrypts data and converts to utf8
}
