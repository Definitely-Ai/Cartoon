import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {FileBlob,PresentationFile}=await import(pathToFileURL('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const revision=process.argv.find(arg=>arg.startsWith('--revision='))?.split('=')[1];
if(revision&&!/^[a-z0-9-]+$/.test(revision))throw new Error('Invalid revision');
const source=path.join('output/presentation',revision??'','rick-system-showcase.pptx');
const destination=path.join('output/rick-showcase-build',revision??'');
await fs.mkdir(destination,{recursive:true});
const deck=await PresentationFile.importPptx(await FileBlob.load(source));
for(const [i,slide] of deck.slides.items.entries()){const png=await deck.export({slide,format:'png',scale:1});await fs.writeFile(path.join(destination,`final-slide-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));}
console.log('Rendered final slides',deck.slides.items.length);
