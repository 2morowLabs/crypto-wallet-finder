import dotenv from 'dotenv';
import { alertWalletFound, generateWallet } from './utils.js';

dotenv.config();

let blastapis = [];

const initBlastapi = () => {
	const BLAST_API_KEYS = process.env.BLAST_API_KEYS.split(',');

	BLAST_API_KEYS.forEach((key) => {
		blastapis.push(`https://eth-mainnet.blastapi.io/${key}`);
	});
};

const main = async () => {
	initBlastapi();

	const startTime = new Date();

	for (let i = 0; true; i++) {
		const { address, mnemonic } = generateWallet();

		//fetch post request to blastapi
		fetch(blastapis[i % blastapis.length], {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 0,
				method: 'eth_getBalance',
				params: [address, 'latest'],
			}),
		})
			.then((response) => {
				response.json().then((data) => {
					const formattedBalace = data.result / 10 ** 18;
					console.log('Balance:', formattedBalace);
					if (formattedBalace > 0) {
						const message = `Wallet found: ${address}, balance: ${formattedBalace} ETH, mnemonic: ${mnemonic}`;
						alertWalletFound(message);
					}
				});
			})
			.catch((error) => {
				console.error('Error while checking balance:', error);
			});

		const timeDiff = new Date() - startTime;
		const seconds = timeDiff / 1000;
		const requestPerSecond = i / seconds;
		if (requestPerSecond > 24.2) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		if (i % 100 === 0) console.log(new Date(), ' -> ', i, 'requestPerSecond: ', requestPerSecond);
		break;
	}
};

main();
