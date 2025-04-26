import { extractStructuresFromMcworld } from "../dist/main.js";

async function test(db) {
	let mcworld = await fetch(db).then(res => res.blob());
	console.log(await extractStructuresFromMcworld(mcworld));
}

await test("./world.zip");
await test("./db.zip");