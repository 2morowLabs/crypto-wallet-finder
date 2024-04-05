import { Alchemy, Network } from 'alchemy-sdk';
import dotenv from 'dotenv';
import { alertWalletFound, generateWallet } from './utils.js';

dotenv.config();

let alchemys = [];

const initAlchemy = () => {
	const ALCHEMY_API_KEYS = process.env.ALCHEMY_API_KEYS.split(',');

	ALCHEMY_API_KEYS.forEach((key) => {
		const settings = {
			apiKey: key,
			network: Network.ETH_MAINNET,
		};
		alchemys.push(new Alchemy(settings));
	});
};

const main = async () => {
	initAlchemy();
	let requestPerSecond;
	let startTime = new Date();
	let promises = [];

	for (let i = 0; true; i++) {
		const { privateKey, address, mnemonic } = generateWallet();
		const promise = alchemys[i % alchemys.length].core
			.getBalance(address, 'latest')
			.then((balance) => {
				const formattedBalace = balance / 10 ** 18;
				if (formattedBalace > 0) {
					const message = `Wallet found: ${address}, balance: ${formattedBalace} ETH, mnemonic: ${mnemonic}`;
					alertWalletFound(message);
				}
			})
			.catch((error) => {
				console.error('Error while checking balance:', error);
				console.error('Wallet:', address, mnemonic);
			});
		promises.push(promise);

		if (i % 20 === 0) {
			const timeDiff = new Date() - startTime;
			const seconds = timeDiff / 1000;
			requestPerSecond = i / seconds;
			if (requestPerSecond > 24.2) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		if (i % 100 === 0) {
			await Promise.all(promises);
			console.log(new Date(), ' -> ', 'requestPerSecond: ', requestPerSecond);
			i = 0;
			startTime = new Date();
		}
	}
};

main();
