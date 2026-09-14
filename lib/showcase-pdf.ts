import type {BestOfCartoon} from './best-of-cartoons';
import {printMetrics,type PrintSizeId,type PrintPaperId} from './cartoon-print';
export async function showcasePDF(cartoons:BestOfCartoon[],size:PrintSizeId,paper:PrintPaperId,newspaper:boolean,onProgress?:(done:number,total:number)=>void) {
  if(!cartoons.length||cartoons.length>12)throw Error('Choose between 1 and 12 cartoons for a print packet.');
  const {PDFDocument,StandardFonts,PrintScaling,rgb}=await import('pdf-lib');
  const pdf=await PDFDocument.create();pdf.setTitle('The Swinging Door - Selected Cartoons');pdf.setAuthor('AI Dream Builders LLC');
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const serif=await pdf.embedFont(StandardFonts.TimesRoman),bold=await pdf.embedFont(StandardFonts.TimesRomanBold),sans=await pdf.embedFont(StandardFonts.Helvetica);
  for(const [index,c] of cartoons.entries()) {
    const response=await fetch(c.src);if(!response.ok)throw Error(`Could not load ${c.title}.`);
    const bytes=new Uint8Array(await response.arrayBuffer());
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
    if(digest!==c.sha256)throw Error('An original image failed its integrity check.');
    const image=await pdf.embedPng(bytes);if(image.width!==c.width||image.height!==c.height)throw Error('Original dimensions changed.');
    const metrics=printMetrics(c.width,c.height,size,paper),width=metrics.width*72,height=metrics.height*72;
    const page=pdf.addPage(newspaper?[792,1224]:[metrics.paper.width*72,metrics.paper.height*72]);
    if(!newspaper)page.drawImage(image,{x:(page.getWidth()-width)/2,y:(page.getHeight()-height)/2,width,height});
    else {
      page.drawText('THE LOCAL EDITION',{x:38,y:1154,size:38,font:bold});
      page.drawText('NEWSPAPER LAYOUT STUDY  /  FICTIONAL MASTHEAD  /  NOT A PUBLISHED ISSUE',{x:40,y:1128,size:9,font:sans});
      page.drawLine({start:{x:38,y:1112},end:{x:754,y:1112},thickness:1.5});
      page.drawText('MONEY & EVERYDAY LIFE',{x:40,y:1084,size:16,font:bold});
      const x=754-width,y=1040-height;
      page.drawImage(image,{x,y,width,height});
      page.drawText('THE SWINGING DOOR',{x,y:y-19,size:11,font:bold});
      page.drawText(`${metrics.width} x ${metrics.height} in  /  ${metrics.ppi} effective PPI`,{x,y:y-34,size:9,font:sans});
      const colWidth=Math.max(180,x-68),fontSize=11;
      page.drawText('A place for the next good line',{x:40,y:1040,size:18,font:bold,maxWidth:colWidth,lineHeight:22});
      const copy='This is a layout study for an editor, not a news report. The space beside the cartoon represents the surrounding newspaper page.\n\nThe artwork keeps its original proportions. Choose a print size to compare its prominence and readability alongside editorial copy.\n\nA familiar room gives readers a recurring destination. A new subject gives them a reason to return.\n\nBefore press, confirm the column width, final dimensions and reproduction requirements with the publication. Black-and-white art avoids reliance on color.\n\nThis preview uses a fictional masthead. It does not imply that a newspaper has published or endorsed the cartoon.';
      let line='',cursor=976;for(const paragraph of copy.split('\n\n')){for(const word of paragraph.split(' ')){if(serif.widthOfTextAtSize(line+word+' ',fontSize)>colWidth){page.drawText(line.trim(),{x:40,y:cursor,size:fontSize,font:serif});cursor-=16;line='';}line+=word+' ';}if(line){page.drawText(line.trim(),{x:40,y:cursor,size:fontSize,font:serif});cursor-=16;line='';}cursor-=12;}
      page.drawLine({start:{x:38,y:68},end:{x:754,y:68},thickness:.6,color:rgb(.3,.3,.3)});
      page.drawText(`11 x 17 inch layout proof. Print at Actual size. Page ${index+1}.`,{x:40,y:48,size:9,font:sans});
    }
    onProgress?.(index+1,cartoons.length);
  }
  return pdf.save();
}
