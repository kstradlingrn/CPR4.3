'use strict';
// Display smoothing applies only to current valid measurements; never hold a lost rate.
class StableCPRRate {
  constructor(){this.reset();}
  reset(){this.history=[];this.value=null;this.at=0;}
  update(result,t){
    if(!Number.isFinite(result.rate)||result.rate<=0){this.reset();return result;}
    this.history=this.history.filter(x=>t-x.t<1500);this.history.push({t,v:result.rate});
    const sorted=this.history.map(x=>x.v).sort((a,b)=>a-b);
    const mid=Math.floor(sorted.length/2),median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
    const alpha=1-Math.exp(-Math.max(0,t-this.at)/1000);
    this.value=this.value===null||t-this.at>1000?median:this.value+alpha*(median-this.value);this.at=t;
    return {...result,rawRate:result.rate,rate:Math.round(this.value)};
  }
}
// Relative camera-motion cue, not compression depth, recoil, or a fatigue diagnosis.
class CPRMovementReference {
  constructor(){this.reset();}
  reset(){this.samples=[];this.baseline=null;}
  update(pose,motion,t){
    if(!(pose>0&&motion>0)){this.reset();return null;}
    if(this.samples.length&&t-this.samples.at(-1).t>1000)this.reset();
    this.samples.push({pose,motion,t});this.samples=this.samples.filter(x=>t-x.t<=10000);
    if(!this.baseline&&t-this.samples[0].t>=5000){
      const median=k=>{const a=this.samples.map(x=>x[k]).sort((a,b)=>a-b);return a[Math.floor(a.length/2)];};
      this.baseline={pose:median('pose'),motion:median('motion')};
    }
    return this.baseline?{pose:pose/this.baseline.pose,motion:motion/this.baseline.motion}:null;
  }
}
class CPRSlowCoach {
  constructor(){this.lastPrompt=-Infinity;this.reset();}
  reset(){this.history=[];this.slowSince=null;this.lastAt=null;this.wasOnTarget=false;this.smallSince=null;}
  update(rate,t,movement=null){
    if(!Number.isFinite(rate)||rate<=0){this.reset();return null;}
    if(this.lastAt!==null&&t-this.lastAt>1000)this.reset();
    this.lastAt=t;
    this.history=this.history.filter(x=>t-x.t<3000);this.history.push({t,rate});
    // Establish a sustained in-range baseline before claiming the rate "has slowed".
    if(this.history.length>1&&t-this.history[0].t>=2000&&this.history.every(x=>x.rate>=100&&x.rate<=120))this.wasOnTarget=true;
    if(rate>=100)this.slowSince=null;
    else if(this.slowSince===null)this.slowSince=t;
    const smaller=movement&&movement.pose<.6&&movement.motion<.6;
    if(!smaller)this.smallSince=null;
    else if(this.smallSince===null)this.smallSince=t;
    const slow=this.slowSince!==null&&t-this.slowSince>=8000;
    const small=this.smallSince!==null&&t-this.smallSince>=8000;
    if((!slow&&!small)||t-this.lastPrompt<45000)return null;
    this.lastPrompt=t;
    let cue=slow?(this.wasOnTarget?'Your compression rate has slowed.':'Your estimated compression rate is below target.'):'';
    if(small)cue+=(cue?' ':'')+'Your tracked movement looks smaller.';
    return cue+' Are you getting tired? If another rescuer is available, consider switching with minimal interruption. Otherwise, keep compressing.';

  }
}
if(typeof module!=='undefined')module.exports={StableCPRRate,CPRSlowCoach,CPRMovementReference};
