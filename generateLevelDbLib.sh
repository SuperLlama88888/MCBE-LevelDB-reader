git clone https://github.com/Mojang/minecraft-creator-tools.git
cd minecraft-creator-tools/app
npm i
npm i -g esbuild
esbuild src/minecraft/LevelDb.ts --bundle --minify --platform=browser --format=esm --outfile=../../LevelDb.js --banner:js="// Copyright (c) Microsoft Corporation. Licensed under the MIT License."