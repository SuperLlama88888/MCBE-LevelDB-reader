import { extractStructureFilesFromMcworld } from "../dist/main.js";

async function test(db) {
	let mcworld = await fetch(db).then(res => res.blob());
	console.log(await extractStructureFilesFromMcworld(mcworld));
}

await test("./world.zip");
await test("./db.zip");