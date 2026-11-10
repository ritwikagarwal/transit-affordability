/**
 * A distance-only spatial sketch for revealing supplied evidence around an anchor.
 * Coordinates use the site's local planar projection in kilometres. Links are
 * straight conceptual research connections. They are not walking routes, pipe
 * routes, biological simulations, eligibility findings or thermal service areas.
 */

const coordinate = value=>Array.isArray(value)&&value.length===2&&value.every(Number.isFinite);
const compareId = (a,b)=>a<b?-1:a>b?1:0;
const squaredDistance = (a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;

/**
 * Build a deterministic Euclidean minimum spanning tree, rooted at `anchor`.
 *
 * - maxNodes caps supplied feature nodes, in addition to the anchor.
 * - Select the nearest distinct feature IDs inside radiusM, with ID tie breaks.
 * - Duplicate IDs resolve to their closest supplied point, then coordinate order.
 * - A zero radius includes only features exactly at the supplied anchor point.
 * - Original feature metadata is retained; no property coordinates are generated.
 *
 * nodes: { ...feature, id, xy, distanceFromAnchorM, depth, order }
 * edges: { from, to, start, end, lengthM, depth, order, growthDelay }
 * `growthDelay` is seconds of editorial animation delay, not a physical timescale.
 */
export function buildExplorationGraph({anchor,features=[],radiusM=800,maxNodes=100}={}){
  if(!coordinate(anchor))throw new TypeError('anchor must be two finite local coordinates in kilometres.');
  if(!Array.isArray(features))throw new TypeError('features must be an array of supplied spatial records.');
  if(!Number.isFinite(radiusM)||radiusM<0)throw new RangeError('radiusM must be a finite nonnegative distance.');
  if(!Number.isSafeInteger(maxNodes)||maxNodes<0)throw new RangeError('maxNodes must be a nonnegative safe integer.');

  const candidates=features.map(feature=>{
    if(!feature||typeof feature!=='object'||Array.isArray(feature)||typeof feature.id!=='string'||!feature.id.trim())throw new TypeError('Each feature must have a nonempty string id.');
    if(feature.id==='anchor')throw new TypeError('The id anchor is reserved for the supplied anchor.');
    if(!coordinate(feature.xy))throw new TypeError(`Feature ${feature.id} must have two finite local coordinates in kilometres.`);
    return {feature,distanceSquared:squaredDistance(anchor,feature.xy)};
  });
  candidates.sort((a,b)=>a.distanceSquared-b.distanceSquared||compareId(a.feature.id,b.feature.id)||a.feature.xy[0]-b.feature.xy[0]||a.feature.xy[1]-b.feature.xy[1]);

  const radiusSquared=(radiusM/1000)**2;
  const selected=[],seen=new Set();
  for(const candidate of candidates){
    if(seen.has(candidate.feature.id))continue;
    seen.add(candidate.feature.id);
    if(candidate.distanceSquared>radiusSquared||selected.length>=maxNodes)continue;
    selected.push({...candidate.feature,xy:[...candidate.feature.xy],distanceFromAnchorM:Math.sqrt(candidate.distanceSquared)*1000});
  }

  const root={id:'anchor',xy:[...anchor],featureType:'anchor',distanceFromAnchorM:0,depth:0,order:0};
  const points=[root,...selected],nodes=[root],edges=[];
  const visited=new Set([0]);
  const parents=points.map(()=>0);
  const distances=points.map(point=>squaredDistance(anchor,point.xy));

  // Prim's algorithm connects each new point to the closest connected point.
  // Stable IDs break equal-distance ties, independently of supplied array order.
  while(visited.size<points.length){
    let next=-1;
    for(let index=1;index<points.length;index++){
      if(visited.has(index))continue;
      if(next<0||distances[index]<distances[next]||
        (distances[index]===distances[next]&&(
          compareId(points[parents[index]].id,points[parents[next]].id)<0||
          (points[parents[index]].id===points[parents[next]].id&&compareId(points[index].id,points[next].id)<0)
        )))next=index;
    }
    const parent=points[parents[next]],node=points[next];
    const order=edges.length,depth=parent.depth+1;
    node.depth=depth;node.order=order+1;
    edges.push({
      from:parent.id,
      to:node.id,
      start:[...parent.xy],
      end:[...node.xy],
      lengthM:Math.sqrt(distances[next])*1000,
      depth,
      order,
      growthDelay:Number(((depth-1)*0.14+order*0.018).toFixed(4)),
    });
    visited.add(next);nodes.push(node);
    for(let index=1;index<points.length;index++){
      if(visited.has(index))continue;
      const distance=squaredDistance(node.xy,points[index].xy);
      if(distance<distances[index]||(distance===distances[index]&&compareId(node.id,points[parents[index]].id)<0)){
        distances[index]=distance;parents[index]=next;
      }
    }
  }
  return {nodes,edges};
}
