const { ethers } = require('ethers');
const { Web3 } = require('web3');
const fs = require('fs');
require('dotenv').config();
const { generateWallet, alertWalletFound } = require('./utils');

const BSC_ENDPOINT = 'https://bsc-dataseed.binance.org/';
const ETH_ENDPOINT = `https://mainnet.infura.io/v3/`;
const POLYGON_ENDPOINT = 'https://rpc-mainnet.maticvigil.com/';
const AVAX_ENDPOINT = `https://avalanche-mainnet.infura.io/v3/`;

const web3Bsc = new Web3(BSC_ENDPOINT);
const web3Polygon = new Web3(POLYGON_ENDPOINT);

const web3Eth = [];
const web3Avax = [];

const initWeb3 = () => {
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

const checkBalance = async (web3, address, privateKey, mnemonic) => {
	try {
		const balanceWei = await web3.eth.getBalance(address);

		const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
		const string = `Address: ${address}, Saldo: ${balanceEther}, private key: ${privateKey}, mnemonic: ${mnemonic}, url: ${web3.currentProvider.clientUrl}`;

		if (parseFloat(balanceEther) !== 0) {
			alertWalletFound(string);
		}
	} catch (error) {
		if (web3.currentProvider.clientUrl.inlcudes('matic')) return;

		console.error('Errore durante il controllo del saldo:', error);
		console.log('Address:', address);
		console.log('Private key:', privateKey);
		console.log('--------------------------------');
	}
};

const main = async () => {
	initWeb3();
	const args = process.argv.slice(2);

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
		if (requestPerSecond > 5) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		if (i % 100 === 0) console.log(new Date(), ' -> ', i, 'requestPerSecond: ', requestPerSecond);
	}
};

const test = async () => {
	initWeb3();
	const address = '0xb4f69b74bb2d90d3ab131929960e4fc8cbe6f054';
	const privateKey = '';

	checkBalance(web3Eth[0], address, privateKey);
	checkBalance(web3Bsc, address, privateKey);
	checkBalance(web3Polygon, address, privateKey);
	checkBalance(web3Avax[0], address, privateKey);
	await new Promise((resolve) => setTimeout(resolve, 5000));
};

main();
// test();
