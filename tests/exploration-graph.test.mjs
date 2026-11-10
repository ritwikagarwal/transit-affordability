import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExplorationGraph} from '../analysis/exploration-graph.js';

const anchor=[-3.5183,-13.5715];
const features=[
  {id:'pluto-a',xy:[-3.4183,-13.5715],featureType:'residential',source:'PLUTO'},
  {id:'pluto-b',xy:[-3.2183,-13.5715],featureType:'parking',source:'PLUTO'},
  {id:'lift-c',xy:[-3.2183,-13.2715],featureType:'public-housing-site',source:'LIFT'},
  {id:'pluto-d',xy:[-4.5183,-13.5715],featureType:'vacant-land',source:'PLUTO'},
];

test('Every feature node and edge endpoint uses an actual supplied coordinate',()=>{
  const input=structuredClone({anchor,features});
  const before=structuredClone(input);
  const graph=buildExplorationGraph(input);
  assert.deepEqual(input,before,'The pure builder must not mutate source records.');
  const supplied=new Map(features.map(feature=>[feature.id,feature.xy]));
  supplied.set('anchor',anchor);
  assert.equal(graph.nodes.length,4);
  for(const node of graph.nodes)assert.deepEqual(node.xy,supplied.get(node.id));
  for(const edge of graph.edges){
    assert.deepEqual(edge.start,supplied.get(edge.from));
    assert.deepEqual(edge.end,supplied.get(edge.to));
    const distance=Math.hypot(edge.end[0]-edge.start[0],edge.end[1]-edge.start[1])*1000;
    assert.ok(Math.abs(edge.lengthM-distance)<1e-9);
  }
  assert.equal(graph.nodes.find(node=>node.id==='lift-c').source,'LIFT');
  graph.nodes[0].xy[0]=0;
  assert.deepEqual(anchor,before.anchor,'Returned coordinates must not alias input arrays.');
});

test('Radius and node cap select nearest real records without implying a full inventory',()=>{
  const graph=buildExplorationGraph({anchor:[0,0],radiusM:800,maxNodes:2,features:[
    {id:'boundary',xy:[0.8,0],featureType:'parcel'},
    {id:'near',xy:[0.1,0],featureType:'parcel'},
    {id:'middle',xy:[0.4,0],featureType:'parcel'},
    {id:'outside',xy:[0.800001,0],featureType:'parcel'},
  ]});
  assert.deepEqual(new Set(graph.nodes.map(node=>node.id)),new Set(['anchor','near','middle']));
  const boundary=buildExplorationGraph({anchor:[0,0],radiusM:800,features:[{id:'edge',xy:[0.8,0]}]});
  assert.equal(boundary.nodes.length,2,'The radius boundary is included.');
  assert.ok(graph.nodes.every(node=>node.distanceFromAnchorM<=800));
});

test('Equal distances and shuffled source order produce the same tree',()=>{
  const tied=[
    {id:'south',xy:[0,-0.1]},
    {id:'north',xy:[0,0.1]},
    {id:'east',xy:[0.1,0]},
    {id:'west',xy:[-0.1,0]},
  ];
  const expected=buildExplorationGraph({anchor:[0,0],features:tied});
  for(const ordered of [[...tied].reverse(),[tied[2],tied[0],tied[3],tied[1]]]){
    assert.deepEqual(buildExplorationGraph({anchor:[0,0],features:ordered}),expected);
  }
});

test('The distance-only tree is connected, acyclic and starts each branch at an existing node',()=>{
  const graph=buildExplorationGraph({anchor,features});
  assert.equal(graph.edges.length,graph.nodes.length-1);
  const reached=new Set(['anchor']),arrivals=new Map([['anchor',-Infinity]]);
  for(const edge of graph.edges){
    assert.ok(reached.has(edge.from));
    assert.ok(!reached.has(edge.to),'A node is connected exactly once.');
    assert.ok(edge.growthDelay>arrivals.get(edge.from),'A branch is revealed after its parent.');
    reached.add(edge.to);arrivals.set(edge.to,edge.growthDelay);
  }
  assert.equal(reached.size,graph.nodes.length);
  assert.ok(Math.abs(graph.edges.reduce((sum,edge)=>sum+edge.lengthM,0)-600)<1e-7,'Known collinear/right-angle example has 600 metres minimum total length.');
});

test('Duplicate feature IDs do not create duplicate nodes or change the cap',()=>{
  const graph=buildExplorationGraph({anchor:[0,0],maxNodes:2,features:[
    {id:'same',xy:[0.6,0]},
    {id:'same',xy:[0.1,0]},
    {id:'same',xy:[0.1,0]},
    {id:'other',xy:[0.2,0]},
  ]});
  assert.equal(graph.nodes.length,3);
  assert.deepEqual(graph.nodes.find(node=>node.id==='same').xy,[0.1,0]);
  assert.equal(new Set(graph.nodes.map(node=>node.id)).size,graph.nodes.length);
});

test('Empty samples, zero cap, zero radius and coincident actual points are handled',()=>{
  assert.deepEqual(buildExplorationGraph({anchor:[0,0],features:[]}).edges,[]);
  assert.equal(buildExplorationGraph({anchor:[0,0],features,maxNodes:0}).nodes.length,1);
  const zero=buildExplorationGraph({anchor:[0,0],radiusM:0,features:[{id:'same-point',xy:[0,0]},{id:'away',xy:[0.001,0]}]});
  assert.equal(zero.nodes.length,2);
  assert.equal(zero.edges[0].lengthM,0);
  assert.deepEqual(zero.edges[0].start,zero.edges[0].end);
});

test('Invalid anchors, distances, caps and feature records are rejected',()=>{
  for(const patch of [
    {anchor:[NaN,0]},
    {anchor:[0]},
    {radiusM:-1},
    {radiusM:Infinity},
    {maxNodes:1.5},
    {maxNodes:-1},
    {features:null},
    {features:[{id:'bad',xy:[0,Infinity]}]},
    {features:[{id:'',xy:[0,0]}]},
    {features:[{id:'anchor',xy:[0,0]}]},
  ])assert.throws(()=>buildExplorationGraph({anchor:[0,0],...patch}),{name:/TypeError|RangeError/});
});
