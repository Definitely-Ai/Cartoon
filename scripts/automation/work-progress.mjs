// Counts completed production milestones, not elapsed time or predicted GPU time.
export function workProgress(stage, quantity, finishedCartoons=0) {
  const total=2+quantity*5;
  if(stage==='uploading')return {stage,completed:total-1,total};
  if(stage==='composed')return {stage,completed:1+finishedCartoons*5,total};
  const match=stage.match(/^(draft|critique|tv|vision|compose)-(\d+)/);
  if(match) {
    const index=Number(match[2])-1, offset={draft:0,critique:1,tv:2,vision:3,compose:4}[match[1]];
    return {stage,completed:Math.min(total-1,1+index*5+offset),total};
  }
  return {stage,completed:0,total};
}
