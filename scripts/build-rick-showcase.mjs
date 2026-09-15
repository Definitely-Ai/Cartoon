import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),skill='C:/Users/admin/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.11814/skills/presentations';
const runtime='C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const content=JSON.parse(await fs.readFile('docs/presentation/rick-showcase.json','utf8'));
const cartoons=[...JSON.parse(await fs.readFile('lib/city-editions.json','utf8')),...JSON.parse(await fs.readFile('lib/best-of-cartoons.json','utf8'))];
const revision=process.argv.find(a=>a.startsWith('--revision='))?.split('=')[1];
if(revision&&!/^[a-z0-9-]+$/.test(revision))throw Error('Invalid revision name');
const tmp=path.join(root,'output/rick-showcase-build',revision||'');await fs.mkdir(tmp,{recursive:true});
const output=path.join(root,'output/presentation',revision||'');await fs.mkdir(output,{recursive:true});
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const font='Georgia',ink='#26312a',bg='#F8F6F0';
function text(slide,value,x,y,w,h,size=24,bold=false,color=ink){const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});shape.text=value;shape.text.style={typeface:font,fontSize:size,bold,color,autoFit:'none'};return shape;}
for(const [i,item] of content.entries()){
  const slide=deck.slides.add();slide.background.fill=bg;
  if(item.cartoon){const c=cartoons.find(c=>c.id===item.cartoon);if(!c)throw Error('Missing cartoon');
    text(slide,item.title,58,item.cover?136:72,660,150,item.cover?56:43,true);
    if(item.subtitle)text(slide,item.subtitle,60,item.cover?294:item.featureCaption?173:205,605,70,27);
    if(item.featureCaption){
      text(slide,`${c.speaker}:`,60,247,585,46,24,true);
      text(slide,`“${c.caption}”`,60,299,625,210,34);
      text(slide,item.body,60,535,625,155,23);
    }else text(slide,item.body,60,item.cover?405:item.subtitle?302:252,585,item.cover?225:390,24);
    slide.images.add({blob:new Uint8Array(await fs.readFile(path.join(root,'public',c.src))),contentType:'image/png',alt:c.caption,fit:'contain',position:{left:780,top:36,width:432,height:648}});
    slide.speakerNotes.textFrame.setText(`Original artwork: ${c.src}\nCaption: ${c.caption}\nSpeaker: ${c.speaker}. ${c.sourceUrl?'Source context: '+c.sourceUrl:'Retained selected cartoon. Not a record of a real conversation.'}\nNo claim that this existing selected image was created by the new unattended run.`);
  }else if(item.steps){
    text(slide,item.title,60,48,1140,100,43,true);
    for(const [j,[label,body]] of item.steps.entries()){const y=170+j*124;text(slide,String(j+1).padStart(2,'0'),60,y,75,65,37,false,'#7A8576');text(slide,label,153,y,1020,44,28,true);text(slide,body,153,y+49,990,73,23);}
    slide.speakerNotes.textFrame.setText('Source: repository automation worker, queue contract and website implementation. Progress reports completed milestones, never a timer. Machine quality review does not constitute human approval. Dedicated hosting remains a future infrastructure decision.');
  }else if(item.table){
    text(slide,item.title,60,48,1140,100,43,true);
    const table=slide.tables.add({rows:5,columns:3,left:60,top:170,width:1160,height:310,columnWidths:[440,280,440],values:item.table});
    table.borders.assign({fill:'#C9CCBF',width:.7,style:'solid'});
    for(let r=0;r<5;r++){table.rows[r].height=62;for(let c=0;c<3;c++){const cell=table.getCell(r,c);cell.fill=r===0?'#263A2D':bg;cell.text.style={typeface:font,fontSize:23,color:r===0?'#FFFFFF':ink,bold:r===0};}}
    text(slide,item.body,60,532,1140,148,24);
    slide.speakerNotes.textFrame.setText('Effective PPI = 1024 pixels divided by print width in inches, rounded. Source: lib/cartoon-print.ts. The embedded original remains 1024 x 1536 pixels. No upsampling or press certification.');
  }
  console.log('Authored slide',i+1,item.title);
}
const candidate=path.join(tmp,'candidate.pptx');await(await PresentationFile.exportPptx(deck)).save(candidate);
const final=path.join(output,'rick-system-showcase.pptx');
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:final,explicitTotalSlideCount:10,pythonExecutable:path.join(runtime,'python/python.exe'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','9'],requiredNativeTableOwnerSlides:[9],fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(tmp,'validation.json')});
for(let i=0;i<deck.slides.items.length;i++){const preview=await deck.export({slide:deck.slides.items[i],format:'png',scale:1});await fs.writeFile(path.join(tmp,`slide-${i+1}.png`),new Uint8Array(await preview.arrayBuffer()));}
console.log('Finalized',final);
