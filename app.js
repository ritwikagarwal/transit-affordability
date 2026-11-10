// Application entry. Copy, data access, UI components and WebGL stay separate.
import {config} from './config.js';
import {AtlasScene} from './scene.js';
import {chapters} from './data/story.js';
import {loadPlanningRecords} from './data/repository.js';
import {loadNetwork,loadSpatialData,loadThermalEvidence} from './data/loaders.js';
import {$,bindDialogs} from './ui/dom.js';
import {renderStory} from './ui/story.js';
import {renderStation,renderSearch,renderPlanningFilters,renderFeaturedStations} from './ui/explorer.js';
import {renderProperty} from './ui/property.js';
import {renderMapKey} from './ui/map-key.js';
import {showSources} from './ui/evidence.js';
import {showStationLab,openStationLab} from './ui/handoff.js';
import {routePresentation} from './transit/routes.js';
import {renderNearby} from './ui/nearby.js';
import {renderNews} from './ui/news.js';

const initial=new URLSearchParams(location.hash.slice(1));
const state={chapter:Math.max(0,Math.min(chapters.length-1,(Number(initial.get('chapter'))||1)-1)),mode:'story',station:null,kind:'all',route:'',feature:null};
let network,records=[],thermalEvidence=[],scene,spatial;

function saveView(){
  const query=new URLSearchParams({chapter:state.chapter+1});
  if(state.mode==='explore'){query.set('mode','explore');if(state.station)query.set('station',state.station.id);if(state.feature)query.set('feature',state.feature.id);}
  history.replaceState(null,'','#'+query.toString());
}
function drawStory(focus=false){
  const chapter=renderStory(state.chapter,network);
  $('#news-panel').hidden=state.mode!=='story'||state.chapter!==0;
  if(scene){
    const station=network.stations.find(item=>item.id===chapter.station);
    scene.reset();
    if(station){scene.focus(station,chapter.view);scene.filter({B19:'D',L15:'L','640':null}[station.id]);}
    scene.setLayers({lift:state.chapter===1||state.chapter===2,land:state.chapter===2,homes:state.chapter===3});
    scene.setGrowth({enabled:[2,3].includes(state.chapter)});
    $('#growth-toggle').checked=[2,3].includes(state.chapter);
    $('#layer-lift').checked=state.chapter===1||state.chapter===2;
    $('#layer-land').checked=state.chapter===2;$('#layer-homes').checked=state.chapter===3;
  }
  if(focus){$('#chapter-title').focus({preventScroll:true});if(innerWidth<=900)window.scrollTo({top:0,behavior:'instant'});}
  saveView();
}
function switchMode(mode){
  state.mode=mode;document.body.dataset.mode=mode;
  $('#explorer').hidden=mode!=='explore';$('#spatial-layers').hidden=mode!=='explore';
  $('#story-mode').classList.toggle('active',mode==='story');$('#explore-mode').classList.toggle('active',mode==='explore');
  if(mode==='story')drawStory();
  else{
    $('#news-panel').hidden=true;
    $('#field-card').hidden=true;$('#next').innerHTML='Return to story <span>→</span>';
    if(!state.station)state.station=network.stations.find(station=>station.id==='B19');
    scene.filter(state.route||null);
    for(const id of ['lift','land','homes'])$('#layer-'+id).checked=true;
    $('#growth-toggle').checked=true;scene.setGrowth({enabled:true});
    selectStation(state.station,false);scene.setLayers({lift:true,land:true,homes:true});
  }
  scene?.resize();saveView();
}
function selectStation(station,enter=true){
  state.station=station;state.feature=null;
  if(enter&&state.mode!=='explore'){switchMode('explore');return;}
  $('#station-search').value='';$('#search-results').innerHTML='';
  if(state.route&&!station.routes.includes(state.route)){state.route='';$('#route-select').value='';scene.filter(null);}
  renderStation(station,network,records,state.kind,thermalEvidence);scene.focus(station,'explore');
  renderNearby(station,spatial,scene.studyRadiusM);
  $('#map-location').textContent=station.name;$('#announcement').textContent=`Selected ${station.name}.`;
  saveView();
}
function selectFeature(feature){
  if(state.mode!=='explore')switchMode('explore');
  state.feature=feature;for(const card of document.querySelectorAll('.property-card')){if(card.dataset.feature===feature.id)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');}renderProperty(feature,{network,thermalEvidence});scene.focusFeature(feature);$('#map-location').textContent=feature.title||feature.address||feature.bbl;
  $('#announcement').textContent=`Selected ${feature.title||feature.address||feature.bbl}.`;
  const layer=feature.featureType==='lift'?'lift':[10,11].includes(feature.landUse)?'land':'homes';
  $('#layer-'+layer).checked=true;scene.setLayers({[layer]:true});
  saveView();
}
function go(index){state.chapter=Math.max(0,Math.min(chapters.length-1,index));if(state.mode!=='story')switchMode('story');else drawStory(true);}
function updateSearch(){if(network)renderSearch(network,$('#station-search').value,state.route);}
function applyRoute(id){
  state.route=id;$('#route-select').value=id;scene.filter(id||null);updateSearch();
  $('#map-key').hidden=true;$('#legend-toggle').setAttribute('aria-expanded','false');
}

bindDialogs();
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.chapter!==undefined){go(Number(button.dataset.chapter));return;}
  if(button.dataset.station){const station=network?.stations.find(item=>item.id===button.dataset.station);if(station)selectStation(station);return;}
  if(button.dataset.source){showSources([button.dataset.source]);return;}
  if(button.dataset.feature){const feature=[...scene.liftSites,...scene.parcels].find(item=>item.id===button.dataset.feature);if(feature)selectFeature(feature);return;}
  if(button.dataset.route){applyRoute(state.route===button.dataset.route?'':button.dataset.route);return;}
  if(button.dataset.planning){state.kind=button.dataset.planning;renderPlanningFilters(state.kind);if(state.station)selectStation(state.station,false);return;}
  switch(button.id){
    case 'next':if(state.mode==='explore')switchMode('story');else if(state.chapter===chapters.length-1)showStationLab();else go(state.chapter+1);break;
    case 'previous':go(state.chapter-1);break;
    case 'story-mode':switchMode('story');break;
    case 'explore-mode':if(network)switchMode('explore');break;
    case 'source-open':showSources();break;
    case 'growth-replay':scene?.replayGrowth();break;
    case 'zoom-in':scene?.zoom(1.3);break;case 'zoom-out':scene?.zoom(1/1.3);break;
    case 'tilt-map':scene?.tilt();break;
    case 'reset-map':scene?.reset();state.route='';$('#route-select').value='';break;
    case 'station-lab-open':showStationLab();break;case 'open-lab':openStationLab();break;
    case 'legend-toggle':$('#map-key').hidden=!$('#map-key').hidden;button.setAttribute('aria-expanded',!$('#map-key').hidden);break;
    case 'legend-close':$('#map-key').hidden=true;$('#legend-toggle').setAttribute('aria-expanded','false');break;
    case 'layers-toggle':$('#layer-options').hidden=!$('#layer-options').hidden;button.setAttribute('aria-expanded',!$('#layer-options').hidden);break;
  }
});
$('.brand').addEventListener('click',event=>{event.preventDefault();go(0);});
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.target.matches('input,select,textarea'))return;
  if(state.mode==='story'&&['ArrowRight','PageDown'].includes(event.key)){event.preventDefault();if(state.chapter<chapters.length-1)go(state.chapter+1);else showStationLab();}
  if(state.mode==='story'&&['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();go(state.chapter-1);}
});
$('#station-search').addEventListener('input',updateSearch);
$('#station-search').addEventListener('keydown',event=>{if(event.key==='Enter')$('#search-results button')?.click();if(event.key==='Escape'){$('#search-results').innerHTML='';event.target.value='';}});
$('#route-select').addEventListener('change',event=>applyRoute(event.target.value));
$('#growth-toggle').addEventListener('change',()=>scene?.setGrowth({enabled:$('#growth-toggle').checked}));
$('#growth-radius').addEventListener('input',()=>{const radiusM=Number($('#growth-radius').value);$('#growth-distance').textContent=radiusM.toLocaleString()+' m';scene?.setGrowth({radiusM});if(state.station)renderNearby(state.station,spatial,radiusM);});
for(const id of ['lift','land','homes'])$('#layer-'+id).addEventListener('change',()=>scene?.setLayers({[id]:$('#layer-'+id).checked}));

async function init(){
  document.title=config.title;renderNews();drawStory();
  try{
    [network,records,thermalEvidence]=await Promise.all([loadNetwork({url:config.networkUrl}),loadPlanningRecords({url:config.planningUrl}),loadThermalEvidence()]);
    scene=new AtlasScene($('#map'),network,station=>selectStation(station),{onFeature:selectFeature});
    $('#map-loading').hidden=true;
    $('#route-select').insertAdjacentHTML('beforeend',network.routes.map(route=>{const item=routePresentation(route.id,network.routes);return `<option value="${item.id}">${item.accessibleName}</option>`;}).join(''));
    renderMapKey(network);renderPlanningFilters();renderFeaturedStations();
    const station=network.stations.find(item=>item.id===initial.get('station'));
    if(initial.get('mode')==='explore'){state.station=station;switchMode('explore');}else drawStory();
    try{
      spatial=await loadSpatialData();scene.setSpatialData(spatial);
      if(state.station)renderNearby(state.station,spatial,scene.studyRadiusM);
      const feature=[...scene.liftSites,...scene.parcels].find(item=>item.id===initial.get('feature'));
      if(feature&&state.mode==='explore')selectFeature(feature);
      $('#lift-count').textContent=spatial.liftSites.length;
      $('#land-count').textContent=spatial.parcels.filter(record=>[10,11].includes(record.landUse)).length;
      $('#homes-count').textContent=spatial.parcels.filter(record=>[1,2,3,4].includes(record.landUse)).length;
    }catch(error){$('#layer-scope').textContent=`Housing map data could not load. ${error.message}`;for(const id of ['lift','land','homes'])$('#layer-'+id).disabled=true;console.error(error);}
  }catch(error){$('#map-loading').textContent=`The map could not load. ${error.message} Please reload the page and try again.`;console.error(error);}
}
init();
