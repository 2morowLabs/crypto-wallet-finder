const { ethers } = require('ethers');
const { Web3 } = require('web3');
const fs = require('fs');
require('dotenv').config();

const telegramToken = process.env.TELEGRAM_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

const BSC_ENDPOINT = 'https://bsc-dataseed.binance.org/';
const ETH_ENDPOINT = `https://mainnet.infura.io/v3/`;
const POLYGON_ENDPOINT = 'https://rpc-mainnet.maticvigil.com/';
const AVAX_ENDPOINT = `https://avalanche-mainnet.infura.io/v3/`;

const web3Bsc = new Web3(BSC_ENDPOINT);
const web3Polygon = new Web3(POLYGON_ENDPOINT);

const web3Eth = [];
const web3Avax = [];

const initWeb3 = () => {
	const args = process.argv.slice(2);
	if (!args.includes('eth') && !args.includes('avax')) return;

	const apiKeys = getApiKeysFromEnv();
	apiKeys.forEach((key) => {
		web3Eth.push(new Web3(ETH_ENDPOINT + key));
		web3Avax.push(new Web3(AVAX_ENDPOINT + key));
	});
};

const getApiKeysFromEnv = () => {
	const apiKeys = process.env.API_KEYS;
	if (!apiKeys) {
		console.error('Errore: non è stato fornito alcun api key');
		process.exit(1);
	}
	console.log('apiKeys:', apiKeys);
	return apiKeys.split(',');
};

const generateWallet = () => {
	const wallet = ethers.Wallet.createRandom();
	const privateKey = wallet.privateKey;
	const address = wallet.address;
	return { privateKey, address };
};

const checkBalance = async (web3, address, privateKey) => {
	try {
		const balanceWei = await web3.eth.getBalance(address);

		const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
		const string = `Address: ${address}, Saldo: ${balanceEther}, private key: ${privateKey}`;
		if (parseFloat(balanceEther) !== 0) {
			sendTelegramMessage(string);
			fs.appendFile('wallets.txt', string + '\n');
			console.log(string);
		}
	} catch (error) {
		console.error('Errore durante il controllo del saldo:', error);
		console.log('Address:', address);
		console.log('Private key:', privateKey);
		console.log('--------------------------------');
	}
};

const sendTelegramMessage = async (message) => {
	const url = `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramChatId}&text=${message}`;
	const response = await fetch(url);
	const data = await response.json();
	console.log(data);
};

const main = async () => {
	initWeb3();

	const args = process.argv.slice(2);

	console.log('args:', args);

	const startTime = new Date();

	for (let i = 0; true; i++) {
		const { privateKey, address } = generateWallet();

		if (args.length > 0) {
			if (args.includes('eth')) {
				checkBalance(web3Eth[i % web3Eth.length], address, privateKey);
			}
			if (args.includes('bsc')) {
				checkBalance(web3Bsc, address, privateKey);
			}
			if (args.includes('polygon')) {
				checkBalance(web3Polygon, address, privateKey);
			}
			if (args.includes('avax')) {
				checkBalance(web3Avax[(i + 1) % web3Avax.length], address, privateKey);
			}
		} else {
			checkBalance(web3Eth[i % web3Eth.length], address, privateKey);
			checkBalance(web3Bsc, address, privateKey);
			checkBalance(web3Polygon, address, privateKey);
			checkBalance(web3Avax[(i + 1) % web3Avax.length], address, privateKey);
		}

		const timeDiff = new Date() - startTime;
		const seconds = timeDiff / 1000;
		const requestPerSecond = i / seconds;
		if (requestPerSecond > 9.8) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		if (i % 100 === 0) console.log(new Date(), ' -> ', i, 'requestPerSecond: ', requestPerSecond);

		// console.log('Tempo trascorso:', seconds, 'secondi', ' --> ', 'Richieste/s:', requestPerSecond);
		// await new Promise((resolve) => setTimeout(resolve, 50));
	}
};

main();
