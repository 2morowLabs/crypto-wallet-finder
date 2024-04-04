import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
dotenv.config();

const telegramToken = process.env.TELEGRAM_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

export const generateWallet = () => {
	const wallet = ethers.Wallet.createRandom();
	const privateKey = wallet.privateKey;
	const address = wallet.address;
	const mnemonic = wallet.mnemonic.phrase;

	return { privateKey, address, mnemonic };
};

const sendTelegramMessage = async (message) => {
	const url = `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramChatId}&text=${message}`;
	const response = await fetch(url);
	const data = await response.json();
	console.log(data);
};

export const alertWalletFound = async (string) => {
	console.log(string);
	sendTelegramMessage(string);
	fs.appendFileSync('wallets.txt', string + '\n');
};
