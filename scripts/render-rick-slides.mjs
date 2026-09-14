import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {FileBlob,PresentationFile}=await import(pathToFileURL('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const deck=await PresentationFile.importPptx(await FileBlob.load('output/presentation/rick-system-showcase.pptx'));
for(const [i,slide] of deck.slides.items.entries()){const png=await deck.export({slide,format:'png',scale:1});await fs.writeFile(`output/rick-showcase-build/final-slide-${i+1}.png`,new Uint8Array(await png.arrayBuffer()));}
console.log('Rendered final slides',deck.slides.items.length);
