/** Illustrative steady peak-heating balance. All inputs are assumptions.
 * Not a district network design, seasonal simulation, tariff or station result.
 */
export function thermalBalance({sourceKW=500, oneWayM=300, lossWPerM=3, cop=4, pumpKW=10, demandWPerM2=60, radiusM=400}={}) {
  const values = [sourceKW,oneWayM,lossWPerM,cop,pumpKW,demandWPerM2,radiusM];
  if(values.some(v=>!Number.isFinite(v)) || sourceKW<0 || oneWayM<0 || lossWPerM<0 || cop<=1 || pumpKW<0 || demandWPerM2<=0 || radiusM<0) throw new RangeError('Invalid thermal scenario input');
  const pipeLossKW=2*oneWayM*lossWPerM/1000;
  const evaporatorKW=Math.max(0,sourceKW-pipeLossKW);
  const heatKW=evaporatorKW/(1-1/cop);
  const compressorKW=heatKW/cop;
  const electricityKW=compressorKW+(heatKW>0?pumpKW:0);
  return {pipeLossKW,evaporatorKW,heatKW,compressorKW,electricityKW,
    systemCOP:electricityKW>0?heatKW/electricityKW:0,
    floorAreaM2:heatKW*1000/demandWPerM2,
    studyAreaKM2:Math.PI*radiusM*radiusM/1e6,
    exhausted:sourceKW<=pipeLossKW};
}
