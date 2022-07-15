async function test() {
	const test = [
		[1, 2, 3, 4, 5, 6],
		[1, 2, 3, 4, 5, 6],
		[1, 2, 3, 4, 5, 6],
		[1, 2, 3, 4, 5, 6],
	];
	for (let i = 0; i < test.length; i++) {
		const t = test[i];
		console.log(t);
		await new Promise((resolve, reject) => {
			for (let i = 0; i < t.length; i++) {
				const element = t[i];
				new Promise((resolve, reject) => {
					console.log(element);
					resolve()
				});
			}
		});
	}
}

test()
