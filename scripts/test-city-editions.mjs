import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {discoverSources} from './automation/production-adapter.mjs';

test('two labeled city editions precede the untouched original 38',async()=>{
  const cities=JSON.parse(await fs.readFile('lib/city-editions.json','utf8'));
  const original=JSON.parse(await fs.readFile('lib/best-of-cartoons.json','utf8'));
  assert.deepEqual(cities.map(c=>c.cityLabel),['Austin, Texas','Los Angeles, California']);
  assert.equal(cities.length+original.length,40);
  assert.equal(new Set([...cities,...original].map(c=>c.id)).size,40);
  const page=await fs.readFile('app/(studio)/gallery/best-of/page.tsx','utf8');
  assert.match(page,/\[\.\.\.cityEditions as BestOfCartoon\[\], \.\.\.bestOfCartoons\]/);
  for(const c of cities){
    const bytes=await fs.readFile('public'+c.src);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),c.sha256);
    const {data,info}=await sharp(bytes).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width,1024);assert.equal(info.height,1536);
    for(let i=0;i<data.length;i+=3)assert.ok(data[i]===data[i+1]&&data[i]===data[i+2]);
    assert.equal((await sharp('public'+c.previewSrc).metadata()).width,640);
    assert.ok(c.caption.split(/\s+/).length<=20);
    assert.ok(c.tv.length<=30);
    assert.equal(new URL(c.sourceUrl).protocol,'https:');
  }
});

test('configured article retrieval preserves evidence and rejects missing or stale evidence',async t=>{
  const start='A verified primary article starts with this exact sentence.';
  const evidence=start+' The local housing figures describe listings, not closed sales. '.repeat(6);
  t.mock.method(globalThis,'fetch',async()=>new Response('<style>not evidence</style><main>'+evidence+'</main>'));
  const source={format:'article',url:'https://example.org/report',title:'Fixture report',startText:start,publishedAt:new Date().toISOString(),scope:'Fixture only'};
  const match={name:'Austin',region:'Texas',country:'US',coverage:'city'};
  const ctx=s=>({job:{input:{location:match}},config:{production:{locations:[{match,sources:[s]}]}},signal:new AbortController().signal});
  const result=await discoverSources(ctx(source));
  assert.ok(result.documents[0].text.startsWith(start));
  assert.equal(result.documents[0].feedUrl,null);
  assert.match(result.documents[0].discovery,/operator-configured/);
  await assert.rejects(discoverSources(ctx({...source,startText:'A sufficiently long missing marker that is not in the page.'})),/No current dated/);
  await assert.rejects(discoverSources(ctx({...source,publishedAt:'2000-01-01'})),/No current dated/);
});
