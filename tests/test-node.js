import { extractStructureFilesFromMcworld } from "../dist/main.js";
import fs from "node:fs";
import path from "node:path";

async function test(db) {
	let bytes = fs.readFileSync(path.join(import.meta.dirname, db));
	let mcworld = new Blob([bytes])
	// let mcworld = await fetch(import.meta.dirname + "/" + db).then(res => res.blob());
	// console.log(mcworld)
	console.log(await extractStructureFilesFromMcworld(mcworld));
}

await test("./world.zip");
await test("./db.zip");