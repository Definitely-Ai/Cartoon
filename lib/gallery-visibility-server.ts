import 'server-only';
import {cartoonCollection} from './cartoon-collection';
import {AutomationError} from './automation-studio-core';
import {queueDatabaseConfig,queueDatabaseData,queueDatabaseRequest} from './automation-queue-server';

export async function hiddenCartoonIds():Promise<string[]>{
  const rows=await queueDatabaseData(queueDatabaseConfig(),'/rest/v1/gallery_visibility?select=cartoon_id&hidden=eq.true&limit=1000');
  if(!Array.isArray(rows)||rows.length>=1000||rows.some(r=>typeof r.cartoon_id!=='string'))throw new AutomationError(503,'Gallery settings are temporarily unavailable.');
  return rows.map(r=>r.cartoon_id);
}
export async function visibleGallery(){const hidden=new Set(await hiddenCartoonIds());return cartoonCollection.filter(c=>!hidden.has(c.id));}
export async function setCartoonHidden(id:unknown,hidden:unknown){
  if(typeof id!=='string'||typeof hidden!=='boolean'||!cartoonCollection.some(c=>c.id===id))throw new AutomationError(400,'Choose a cartoon in this collection.');
  await queueDatabaseRequest(queueDatabaseConfig(),'/rest/v1/gallery_visibility?on_conflict=cartoon_id',{cartoon_id:id,hidden,updated_at:new Date().toISOString()},'resolution=merge-duplicates,return=minimal');
  return {id,hidden};
}
