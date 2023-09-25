const express = require("express");
const { randomUUID } = require("crypto");
const app = express();
const port = 3000;

const DATABASE_LAG_MS = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let discountsTable = [
	{
		id: randomUUID(),
		code: "ABCDEF",
		isUsed: false,
		value: 1,
	},
];

const itemToBuy = {
	id: randomUUID(),
	price: 200,
	name: "cool hat",
};

console.log({ discountsTable }, { itemToBuy });

const findDiscountByCode = (code) => {
	console.log("finding by code", { code });
	const discount = discountsTable.find((d) => d.code === code);
	if (!discount) {
		return null;
	}
	return JSON.parse(JSON.stringify(discount));
};

const saveDiscount = (discount) => {
	console.log("saving", { discount });
	const existing = discountsTable.find((d) => d.id === discount.id);
	if (!existing) {
		discountsTable.push(JSON.parse(JSON.stringify(discount)));
	} else {
		const index = discountsTable.indexOf(existing);
		discountsTable[index] = JSON.parse(JSON.stringify(discount));
	}
};

const success = {
	success: true,
};

const failure = {
	success: false,
};

const applyDiscount = (discount) => {
	console.log("apply discount", { discount });
	if (discount.isUsed) {
		return failure;
	}

	discount.isUsed = true;
	if (itemToBuy.price - discount.value < 0) {
		return failure;
	}
	itemToBuy.price -= discount.value;
	return success;
};

const laggedDatabase = async (callback) => {
	await sleep(DATABASE_LAG_MS);
	return await callback();
};

app.get("/apply-discount", async (req, res) => {
	const { code } = req.query;
	const discount = await laggedDatabase(() => findDiscountByCode(code));
	if (!discount) {
		return res.status(404).json({
			...failure,
			message: "No such code",
		});
	}
	const result = applyDiscount(discount);
	await laggedDatabase(() => saveDiscount(discount));

	console.log("return to the user", { result });
	res.json(result);
});

app.get("/item-price", (req, res) => {
	res.json({
		...success,
		data: itemToBuy,
	});
});

app.all("/*", (req, res) => {
	res.json({
		...success,
		time: new Date().getTime(),
	});
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
