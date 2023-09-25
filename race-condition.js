const host = "http://localhost:3000";

const singleDiscountCode = "ABCDEF";

const sendRequest = async (endpoint) => {
	const response = await fetch(`${host}/${endpoint}`);
	return await response.json();
};

const ROUNDS = 200;

const checkItemPrice = async () => {
	const result = await sendRequest("item-price");
	console.log({ result });
};

const main = async () => {
	await checkItemPrice();
	const discountEndpoint = `apply-discount?code=${singleDiscountCode}`;
	let reqs = 0;
	await new Promise(async (resolve) => {
		for (let i = 0; i < ROUNDS; i++) {
			sendRequest(discountEndpoint).then((text) => {
				console.log(i, { text });
				reqs++;
			});
		}

		// wait for all requests to finish
		while (reqs < ROUNDS) {
			await new Promise((r) => setTimeout(r, 100));
		}
		return resolve();
	});
	await checkItemPrice();
};

(() => main())();
