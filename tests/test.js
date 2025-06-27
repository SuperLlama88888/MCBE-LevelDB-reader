import { extractStructureFilesFromMcworld } from "../dist/main.js";
import * as NBT from "nbtify-readonly-typeless";

async function test(db) {
	let mcworld = await fetch(db).then(res => res.blob());
	let structureFiles = await extractStructureFilesFromMcworld(mcworld);
	console.log(structureFiles);
	let structures = new Map();
	await Promise.all(Array.from(structureFiles).map(async ([name, structureFile]) => {
		structures.set(name, await NBT.read(structureFile));
	}));
	console.log(structures);
}

await test("./world.zip");
await test("./db.zip");