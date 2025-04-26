# This generate a very bloated LevelDb.js file, which doesn't work when run in Node.js.
# When bundling, esbuild doesn't remove unused class methods. This makes it include so much unnecessary stuff, some of which breaks it when run in Node.js. The one in this repository has been tinkered with to remove most of the bloat (which comes from the logging library...)
# If you want to update the library from minecraft-creator-tools, just tinker around a bit removing unused methods etc.

git clone https://github.com/Mojang/minecraft-creator-tools.git
cd minecraft-creator-tools/app
npm i
npm i -g esbuild
esbuild src/minecraft/LevelDb.ts --bundle --external:pako --minify --platform=browser --format=esm --outfile=../../LevelDb.js --banner:js="// Copyright (c) Microsoft Corporation. Licensed under the MIT License."