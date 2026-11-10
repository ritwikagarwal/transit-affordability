import {routePresentation} from './transit/routes.js';
import {buildExplorationGraph} from './analysis/exploration-graph.js';

// Geographic rendering uses local kilometres. This is not a parcel survey projection.
const projectGeographic = ([lon,lat]) => [(lon+73.96)*84.3,(lat-40.73)*111.2];
const rgb = hex => [1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)/255);
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const transformGLSL = `
  vec2 transform(vec2 position) {
    vec2 d=position-uCenter;
    float c=cos(uAngle),s=sin(uAngle);
    vec2 p=vec2(c*d.x-s*d.y,(s*d.x+c*d.y)*uTilt);
    return p*uScale*2.0/uResolution+uOffset;
  }`;
const uniformsGLSL = `
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform vec2 uOffset;
  uniform float uScale;
  uniform float uAngle;
  uniform float uTilt;`;
// Both shaders use the same camera. Ribbon width is measured in screen pixels.
const vertexPoints = `attribute vec2 aPosition;attribute vec4 aColor;uniform float uSize;
  ${uniformsGLSL} varying vec4 vColor;${transformGLSL}
  void main(){gl_Position=vec4(transform(aPosition),0.0,1.0);gl_PointSize=uSize;vColor=aColor;}`;
const vertexLines = `attribute vec2 aStart;attribute vec2 aEnd;attribute vec2 aCorner;attribute vec4 aColor;
  ${uniformsGLSL} uniform float uWidth;varying vec4 vColor;${transformGLSL}
  void main(){
    vec2 a=transform(aStart),b=transform(aEnd);
    vec2 direction=(b-a)*uResolution;
    float distancePixels=length(direction);
    vec2 normal=distancePixels>0.0?vec2(-direction.y,direction.x)/distancePixels:vec2(0.0);
    vec2 position=mix(a,b,aCorner.x)+normal*aCorner.y*uWidth/uResolution;
    gl_Position=vec4(position,0.0,1.0);vColor=aColor;
  }`;
const fragment = `precision mediump float;varying vec4 vColor;uniform float uCircle;
  void main(){float a=vColor.a;if(uCircle>0.5){float d=length(gl_PointCoord-vec2(0.5));a*=1.0-smoothstep(0.32,0.5,d);}gl_FragColor=vec4(vColor.rgb,a);}`;

export class AtlasScene {
  constructor(container,network,onStation,{onFeature=()=>{}}={}) {
    this.container=container;this.data=network;this.onStation=onStation;this.onFeature=onFeature;
    this.canvas=container.querySelector('#gl-map');this.labels=container.querySelector('#map-labels');
    this.ctx=this.labels.getContext('2d');
    this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
    this.cam={x:1,y:0,scale:16,angle:-.14,tilt:.86};this.target={...this.cam};
    this.mode='city';this.routeFilter=null;this.selected=null;this.hover=null;
    this.parcels=[];this.liftSites=[];this.layers={lift:false,land:false,homes:false};
    this.growthEnabled=false;this.studyRadiusM=800;this.graph={nodes:[],edges:[]};this.growthStarted=0;this.growthDuration=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.dirty=true;this.drag=null;this.last=0;this.pointers=new Map();this.lost=false;
    this.labelPlaces=[['Manhattan',-73.976,40.79],['Brooklyn',-73.955,40.65],['Queens',-73.825,40.75],['The Bronx',-73.865,40.85],['Staten Island',-74.14,40.596]];
    if(this.gl){this.initGL();this.buildGeography();}
    this.buildNetwork();
    this.bind();new ResizeObserver(()=>this.resize()).observe(container);this.resize();
    this.animate=this.animate.bind(this);requestAnimationFrame(this.animate);
  }
  makeProgram(vertex){
    const gl=this.gl;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    return {program,uniforms:Object.fromEntries(['uResolution','uCenter','uOffset','uScale','uAngle','uTilt','uSize','uCircle','uWidth'].map(key=>[key,gl.getUniformLocation(program,key)]))};
  }
  initGL(){
    this.pointsProgram=this.makeProgram(vertexPoints);this.linesProgram=this.makeProgram(vertexLines);
    const gl=this.gl;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  }
  replaceBuffer(key,values,stride){
    const gl=this.gl;if(this[key])gl.deleteBuffer(this[key].buffer);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
    this[key]={buffer,count:values.length/stride};
  }
  buildGeography(){
    const land=[],coasts=[];
    for(const [x,y] of this.data.landPoints)land.push(x,y,.5,.5,.5,.075);
    for(const borough of this.data.boroughs)for(const ring of borough.rings)for(let i=1;i<ring.length;i++)for(const [x,y] of [ring[i-1],ring[i]])coasts.push(x,y,.5,.5,.5,.27);
    this.replaceBuffer('landBuffer',land,6);this.replaceBuffer('coastBuffer',coasts,6);
  }
  buildNetwork(){
    // Draw the selected station's services above coincident limited-service paths.
    // All bundled scheduled geometry remains available in the route filter.
    let selectedRoutes=this.selected?.routes||[];
    if(this.selected?.featureType){const nearest=this.data.stations.reduce((best,station)=>Math.hypot(station.xy[0]-this.selected.xy[0],station.xy[1]-this.selected.xy[1])<Math.hypot(best.xy[0]-this.selected.xy[0],best.xy[1]-this.selected.xy[1])?station:best);selectedRoutes=nearest.routes;}
    this.activeSegments=this.data.segments.filter(segment=>!this.routeFilter||segment[0]===this.routeFilter).sort((a,b)=>Number(selectedRoutes.includes(a[0]))-Number(selectedRoutes.includes(b[0])));
    this.activeStations=this.data.stations.filter(station=>!this.routeFilter||station.routes.includes(this.routeFilter));
    if(this.gl){
      const ribbons=[],stations=[];
      const corners=[[0,-1],[0,1],[1,-1],[1,-1],[0,1],[1,1]];
      for(const [id,x,y,a,b] of this.activeSegments){
        const color=rgb(routePresentation(id,this.data.routes).color);
        for(const [t,side] of corners)ribbons.push(x,y,a,b,t,side,...color,1);
      }
      for(const station of this.activeStations)stations.push(...station.xy,.94,.94,.94,.9);
      this.replaceBuffer('routeBuffer',ribbons,10);this.replaceBuffer('stationBuffer',stations,6);
    }
    this.dirty=true;
  }
  resize(){
    const box=this.container.getBoundingClientRect();this.width=box.width;this.height=box.height;this.dpr=Math.min(devicePixelRatio||1,2);
    for(const canvas of [this.canvas,this.labels]){canvas.width=Math.round(this.width*this.dpr);canvas.height=Math.round(this.height*this.dpr);}
    if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
    this.origin=[this.width*(this.width>900?.68:.5),this.height*.51];
    this.usableWidth=this.width*(this.width>900?.61:.94);
    this.cityScale=Math.min(this.usableWidth/39,this.height/40);
    if(this.mode==='city')this.target.scale=this.cityScale;
    if(!this.initialized){this.cam={...this.target};this.initialized=true;}
    this.dirty=true;
  }
  project(x,y){
    const c=Math.cos(this.cam.angle),s=Math.sin(this.cam.angle),dx=x-this.cam.x,dy=y-this.cam.y;
    return [this.origin[0]+(c*dx-s*dy)*this.cam.scale,this.origin[1]-(s*dx+c*dy)*this.cam.tilt*this.cam.scale];
  }
  camera(program){
    const gl=this.gl,u=program.uniforms;gl.useProgram(program.program);
    gl.uniform2f(u.uResolution,this.width,this.height);gl.uniform2f(u.uCenter,this.cam.x,this.cam.y);
    gl.uniform2f(u.uOffset,(this.origin[0]/this.width-.5)*2,(.5-this.origin[1]/this.height)*2);
    gl.uniform1f(u.uScale,this.cam.scale);gl.uniform1f(u.uAngle,this.cam.angle);gl.uniform1f(u.uTilt,this.cam.tilt);
  }
  drawPoints(buffer,primitive,size,circle=true){
    if(!buffer)return;const gl=this.gl,p=this.pointsProgram;this.camera(p);gl.bindBuffer(gl.ARRAY_BUFFER,buffer.buffer);
    for(const [name,length,offset] of [['aPosition',2,0],['aColor',4,8]]){const location=gl.getAttribLocation(p.program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,length,gl.FLOAT,false,24,offset);}
    gl.uniform1f(p.uniforms.uSize,size*this.dpr);gl.uniform1f(p.uniforms.uCircle,circle?1:0);gl.drawArrays(primitive,0,buffer.count);
  }
  drawRoutes(){
    const gl=this.gl,p=this.linesProgram;this.camera(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.routeBuffer.buffer);
    for(const [name,length,offset] of [['aStart',2,0],['aEnd',2,8],['aCorner',2,16],['aColor',4,24]]){const location=gl.getAttribLocation(p.program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,length,gl.FLOAT,false,40,offset);}
    gl.uniform1f(p.uniforms.uWidth,this.cam.scale>45?2.7:2);gl.uniform1f(p.uniforms.uCircle,0);gl.drawArrays(gl.TRIANGLES,0,this.routeBuffer.count);
  }
  render(){
    const gl=this.gl;
    if(gl&&!this.lost){gl.clear(gl.COLOR_BUFFER_BIT);this.drawPoints(this.landBuffer,gl.POINTS,1.1);this.drawPoints(this.coastBuffer,gl.LINES,1,false);this.drawRoutes();this.drawPoints(this.stationBuffer,gl.POINTS,this.cam.scale>60?4.5:2.9);}
    this.drawLabels();
  }
  setSpatialData({parcels=[],liftSites=[]}){
    this.parcels=parcels.map(record=>({...record,featureType:'parcel',xy:projectGeographic(record.coordinates)}));
    this.liftSites=liftSites.filter(record=>Array.isArray(record.coordinates)).map(record=>({...record,featureType:'lift',xy:projectGeographic(record.coordinates)}));
    this.rebuildGrowth();this.dirty=true;
  }
  setLayers(layers){Object.assign(this.layers,layers);this.rebuildGrowth();this.dirty=true;}
  setGrowth({enabled=this.growthEnabled,radiusM=this.studyRadiusM}={}){
    this.growthEnabled=enabled;this.studyRadiusM=radiusM;this.rebuildGrowth();
  }
  replayGrowth(){this.growthStarted=performance.now();this.dirty=true;}
  rebuildGrowth(){
    const caption=this.container.querySelector('#growth-caption');
    if(!this.growthEnabled||!this.selected){this.graph={nodes:[],edges:[]};if(caption)caption.hidden=true;this.dirty=true;return;}
    const features=[...(this.layers.lift?this.liftSites:[]),...this.parcels.filter(record=>(this.layers.land&&[10,11].includes(record.landUse))||(this.layers.homes&&[1,2,3,4].includes(record.landUse)))].filter(record=>record.id!==this.selected.id);
    this.graph=buildExplorationGraph({anchor:this.selected.xy,features,radiusM:this.studyRadiusM,maxNodes:100});
    // Schedule children after their parent arrives. Seconds are animation time only.
    const arrivals=new Map([['anchor',0]]);
    for(const edge of this.graph.edges){edge.begin=arrivals.get(edge.from);edge.duration=.08+Math.min(edge.lengthM/600,.2);edge.finish=edge.begin+edge.duration;arrivals.set(edge.to,edge.finish);}
    this.growthDuration=Math.max(0,...arrivals.values());this.replayGrowth();
    if(caption){caption.hidden=false;const count=this.graph.nodes.length-1;caption.innerHTML=`<strong>${count===100?'Nearest 100':count} loaded records · ${this.studyRadiusM.toLocaleString()} m study distance</strong><span>Growing exploration links. Distance only.</span><small>Not TEN pipe routes or a thermal service area.</small>`;}
  }
  drawGrowth(){
    if(!this.growthEnabled||!this.selected||!this.graph.edges.length)return;
    const ctx=this.ctx,age=this.reduced?Infinity:(performance.now()-this.growthStarted)/1000;
    const tempo=this.growthDuration>4?4/this.growthDuration:1;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(const edge of this.graph.edges){
      const progress=clamp((age/tempo-edge.begin)/edge.duration,0,1);if(!progress)continue;
      const a=this.project(...edge.start),b=this.project(...edge.end),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
      const bend=Math.min(18,length*.12)*(edge.order%2?1:-1),control=[(a[0]+b[0])/2-dy/Math.max(1,length)*bend,(a[1]+b[1])/2+dx/Math.max(1,length)*bend];
      const at=t=>[(1-t)**2*a[0]+2*(1-t)*t*control[0]+t*t*b[0],(1-t)**2*a[1]+2*(1-t)*t*control[1]+t*t*b[1]];
      ctx.beginPath();ctx.moveTo(...a);for(let step=1;step<=16;step++)ctx.lineTo(...at(progress*step/16));
      ctx.strokeStyle='#f2efe61f';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#f2efe6c4';ctx.lineWidth=1.25;ctx.stroke();
      if(progress<1){ctx.fillStyle='#f15b3a';ctx.beginPath();ctx.arc(...at(progress),2.5,0,Math.PI*2);ctx.fill();}
    }
    const [x,y]=this.project(...this.selected.xy);ctx.strokeStyle='#f15b3a';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  visibleFeatures(){
    const features=[];
    if(this.layers.lift)features.push(...this.liftSites);
    if(this.cam.scale>32){for(const record of this.parcels){if((this.layers.land&&[10,11].includes(record.landUse))||(this.layers.homes&&[1,2,3,4].includes(record.landUse)))features.push(record);}}
    return features;
  }
  drawLabels(){
    const ctx=this.ctx;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);
    if(!this.gl||this.lost){
      ctx.lineWidth=2;for(const [id,x,y,a,b] of this.activeSegments){ctx.strokeStyle=routePresentation(id,this.data.routes).color;ctx.beginPath();ctx.moveTo(...this.project(x,y));ctx.lineTo(...this.project(a,b));ctx.stroke();}
    }
    ctx.textAlign='center';ctx.font='11px Arial, sans-serif';ctx.fillStyle='#777';
    if(this.cam.scale<45)for(const [name,lon,lat] of this.labelPlaces){const point=this.project(...projectGeographic([lon,lat]));ctx.fillText(name,...point);}
    this.drawGrowth();
    // Real dataset points. Shapes distinguish these overlays from transit lines.
    for(const record of this.visibleFeatures()){
      const [x,y]=this.project(...record.xy);if(x<0||x>this.width||y<0||y>this.height)continue;
      const lift=record.featureType==='lift',land=[10,11].includes(record.landUse),size=lift?6:land?5:3;
      ctx.fillStyle=lift?'#f5f5f5':land?'#ffca39':'#acacac';ctx.strokeStyle='#090909';ctx.lineWidth=1.5;
      if(lift||land){ctx.fillRect(x-size/2,y-size/2,size,size);ctx.strokeRect(x-size/2,y-size/2,size,size);}else{ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();}
    }
    // Field-context stations use rings. The rings are not a thermal catchment.
    for(const id of ['B19','L15','R32','640']){
      const station=this.data.stations.find(s=>s.id===id);const [x,y]=this.project(...station.xy);
      ctx.strokeStyle=id===this.selected?.id?'#f15b3a':'#bcbcbc';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,id===this.selected?.id?7:4.5,0,Math.PI*2);ctx.stroke();
      if(!this.selected&&this.width>600&&['B19','640'].includes(id))this.label(station.name,x+13,y-8,false);
    }
    const item=this.hover||this.selected;
    if(item){const [x,y]=this.project(...item.xy);this.label(item.title||item.address||item.name,x+14,y-15,true);}
    const metres=this.cam.scale>100?200:this.cam.scale>40?1000:5000;
    const length=metres/1000*this.cam.scale;
    const left=this.width>900?this.width*.43:24;
    ctx.strokeStyle='#6b6b6b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,this.height-26);ctx.lineTo(left+length,this.height-26);ctx.stroke();
    ctx.textAlign='left';ctx.font='9px Arial,sans-serif';ctx.fillStyle='#7e7e7e';ctx.fillText(`${metres>=1000?metres/1000+' km':metres+' m'} · approximate`,left,this.height-35);
  }
  label(text,x,y,box){
    const ctx=this.ctx;ctx.font='11px Arial,sans-serif';ctx.textAlign='left';
    const label=String(text).length>42?String(text).slice(0,39)+'…':String(text);const width=ctx.measureText(label).width+20;
    x=clamp(x,8,this.width-width-8);y=clamp(y,20,this.height-65);
    if(box){ctx.fillStyle='#151515f5';ctx.fillRect(x,y-19,width,31);ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.strokeRect(x,y-19,width,31);}
    ctx.fillStyle='#f3f3f3';ctx.fillText(label,x+10,y+1);
  }
  focus(station,mode='explore'){
    this.selected=station;this.mode=mode;this.buildNetwork();
    this.target={x:station.xy[0],y:station.xy[1],scale:Math.min(this.usableWidth/3.2,280),angle:mode==='thermal'?.05:-.1,tilt:.82};this.rebuildGrowth();this.dirty=true;
  }
  focusFeature(feature){this.selected=feature;this.mode='explore';this.buildNetwork();this.target={...this.target,x:feature.xy[0],y:feature.xy[1],scale:Math.min(this.usableWidth/3,240)};this.rebuildGrowth();this.dirty=true;}
  reset(){this.mode='city';this.selected=null;this.routeFilter=null;this.buildNetwork();this.target={x:1,y:0,scale:this.cityScale,angle:-.14,tilt:.86};this.rebuildGrowth();this.dirty=true;}
  filter(route){this.routeFilter=route;this.buildNetwork();}
  zoom(factor){this.target.scale=clamp(this.target.scale*factor,this.cityScale*.65,600);this.dirty=true;}
  tilt(){this.target.tilt=this.target.tilt<.95?1:.6;this.dirty=true;}
  nearest(x,y){
    let feature=null,best=11;
    for(const record of this.visibleFeatures()){const point=this.project(...record.xy),distance=Math.hypot(x-point[0],y-point[1]);if(distance<best){feature=record;best=distance;}}
    if(feature)return feature;
    let station=null;best=15;
    for(const record of this.activeStations){const point=this.project(...record.xy),distance=Math.hypot(x-point[0],y-point[1]);if(distance<best){station=record;best=distance;}}
    return station;
  }
  bind(){
    const container=this.container;
    container.addEventListener('pointerdown',event=>{if(event.target.closest('button,a,input,select,aside,#spatial-layers'))return;this.drag={x:event.clientX,y:event.clientY,moved:false};container.setPointerCapture(event.pointerId);});
    container.addEventListener('pointermove',event=>{
      const box=container.getBoundingClientRect();
      if(this.drag){const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>1)this.drag.moved=true;const u=dx/this.cam.scale,v=-dy/(this.cam.scale*this.cam.tilt),angle=this.cam.angle;this.target.x-=Math.cos(angle)*u+Math.sin(angle)*v;this.target.y-=-Math.sin(angle)*u+Math.cos(angle)*v;this.drag.x=event.clientX;this.drag.y=event.clientY;}
      else{this.hover=this.nearest(event.clientX-box.left,event.clientY-box.top);container.style.cursor=this.hover?'pointer':'grab';}
      this.dirty=true;
    });
    container.addEventListener('pointerup',event=>{if(this.drag&&!this.drag.moved){const box=container.getBoundingClientRect(),record=this.nearest(event.clientX-box.left,event.clientY-box.top);if(record){if(record.featureType)this.onFeature(record);else this.onStation(record);}}this.drag=null;});
    container.addEventListener('pointercancel',()=>this.drag=null);container.addEventListener('pointerleave',()=>{this.hover=null;this.dirty=true;});
    container.addEventListener('wheel',event=>{if(event.target.closest('aside,#layer-options'))return;event.preventDefault();this.zoom(Math.exp(-event.deltaY*.001));},{passive:false});
    container.addEventListener('keydown',event=>{if(['+','='].includes(event.key)){event.preventDefault();this.zoom(1.25);}if(event.key==='-'){event.preventDefault();this.zoom(.8);}});
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.dirty=true;});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.initGL();this.buildGeography();this.buildNetwork();});
  }
  animate(now){
    const dt=Math.min(.05,(now-this.last)/1000||.016);this.last=now;let moving=false;
    for(const key of Object.keys(this.cam)){const difference=this.target[key]-this.cam[key];if(Math.abs(difference)>.0001){this.cam[key]+=difference*(this.reduced?1:Math.min(1,dt*5));moving=true;}}
    const growing=this.growthEnabled&&!this.reduced&&(now-this.growthStarted)/1000<Math.min(4,this.growthDuration)+.1;
    if(!document.hidden&&(this.dirty||moving||growing)){this.render();this.dirty=false;}
    requestAnimationFrame(this.animate);
  }
}
