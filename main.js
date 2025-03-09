import LevelDb from "./LevelDb.js";
import * as NBT from "https://esm.sh/nbtify";
import { BlobReader, ZipReader, Uint8ArrayWriter } from "https://esm.sh/@zip.js/zip.js";

let mcworld = await fetch("./world.zip").then(res => res.blob());
console.log(await extractStructureFilesFromMcworld(mcworld));

async function readLevelDB(zip) {
	let folder = new ZipReader(new BlobReader(zip));
	let fileEntries = await folder.getEntries();
	folder.close();

	let files = await Promise.all(fileEntries.map(async entry => {
		let iFile = {
			content: await entry.getData(new Uint8ArrayWriter()),
			loadContent: () => new Date(),
			name: entry.filename,
			storageRelativePath: entry.filename,
			fullPath: entry.filename
		};
		return iFile;
		// return new Proxy(iFile, {
		// 	get(target, prop, receiver) {
		// 		console.log(`Property accessed: ${String(prop)}`);
		// 		props.add(prop);
		// 		return Reflect.get(target, prop, receiver);
		// 	}
		// });
	}));
	
	let ldbFileArr = [];
	let logFileArr = [];
	let manifestFileArr = [];
	files.forEach(file => {
		if(file.name.startsWith("MANIFEST")) {
			manifestFileArr.push(file);
		} else if(file.name.endsWith("ldb")) {
			ldbFileArr.push(file);
		} else if(file.name.endsWith("log")) {
			logFileArr.push(file);
		}
	});

	let levelDb = new LevelDb(ldbFileArr, logFileArr, manifestFileArr, "LlamaStructureReader");
	await levelDb.init(message => {
		console.log(`LevelDB: ${message}`);
	});
	return levelDb.keys;
}
async function extractStructureFilesFromMcworld(mcworld) {
	let levelDbKeys = await readLevelDB(mcworld);
	
	let structures = new Map();
	await Promise.all(Object.entries(levelDbKeys).map(async ([key, value]) => {
		let strKey = key.toString();
		if(strKey.startsWith("structuretemplate_")) {
			let structureName = strKey.replace(/^structuretemplate_/, "");
			let structure = await NBT.read(value.value);
			structures.set(structureName, structure);
		}
	}));
	return structures;
}