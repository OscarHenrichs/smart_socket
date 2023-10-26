var CryptoJS = require("crypto-js");
require("dotenv-safe").config({ allowEmptyValues: true });

function encryptData(data) {
	return CryptoJS.AES.encrypt("my message", process.env.ENCRYPT_SECRET).toString();
}

function decryptData(encryptedData) {
	return CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPT_SECRET).toString(); // Decrypts data and converts to utf8
}

module.exports = { encryptData, decryptData };
