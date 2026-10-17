'use strict';
// Local raw-camera recording and synchronized tracker logs. No uploads.
class CPRTestRecorder {
  constructor(ui, env={}) {
    this.ui=ui;this.env=env;this.recorder=null;this.chunks=[];this.saved=null;this.active=false;this.finishing=false;this.lastLog=-Infinity;
  }
  now(){return (this.env.now||(()=>performance.now()))();}
  supported(){return !!(this.env.MediaRecorder||globalThis.MediaRecorder);}
  message(s){this.ui.message(s);}
  start(stream,details={}) {
    if(this.active||this.finishing)throw Error('A recording is already active or finishing.');
    const MR=this.env.MediaRecorder||globalThis.MediaRecorder;
    if(!MR)throw Error('This browser cannot record camera video. Use iPhone Screen Recording for this test.');
    let mime=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm'].find(x=>MR.isTypeSupported?.(x));
    const r=new MR(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:2000000});
    this.saved=null;this.chunks=[];this.error=null;this.started=this.now();this.wallStarted=new Date().toISOString();this.lastLog=-Infinity;this.details=details;this.samples=[];this.active=true;this.recorder=r;this.ui.state(this);
    r.ondataavailable=e=>{if(e.data?.size)this.chunks.push(e.data);};
    r.onerror=e=>{this.error=e.error?.message||'Recorder error';this.message('Recording error. Stopping and preserving available video: '+this.error);this.stop('recorder-error');};
    r.onstop=()=>{
      clearTimeout(this.limit);this.active=false;this.finishing=false;
      const type=this.chunks.find(x=>x.type)?.type||r.mimeType||mime||'video/webm';
      const video=new Blob(this.chunks,{type});
      const stem='CPR_Test_'+this.wallStarted.replace(/[:.]/g,'-');
      const meta={schema:2,trackerBuild:'CPR-Test-31',startedUTC:this.wallStarted,durationSeconds:(this.stopped-this.started)/1000,stopReason:this.stopReason,recorderError:this.error||null,camera:this.details,coordinateSystem:'unmirrored original camera pixels; normalized focus coordinates',synchronization:'Times relative to MediaRecorder.start request, not hardware exposure timestamps. Encoder startup offset is unmeasured.',warning:'Tracker rates are unverified estimates, not compression ground truth. No depth or fatigue measurement.',samples:this.samples};
      if(video.size)this.saved={video,log:new Blob([JSON.stringify(meta,null,2)],{type:'application/json'}),videoName:stem+(type.includes('mp4')?'.mp4':'.webm'),logName:stem+'.json'};
      this.recorder=null;this.chunks=[];this.ui.state(this);
      this.message(video.size?'Recording ready. Save/share both the camera video and readings log before closing this page.'+(this.error?' The recording ended with an error; inspect the saved video.':''):'No video data was captured. Keep the page open and try again.');
      this.resolveStop?.();this.resolveStop=null;
    };
    try{r.start(1000);}catch(e){this.active=false;this.recorder=null;this.ui.state(this);throw e;}
    this.limit=setTimeout(()=>{this.stop('three-minute-limit');},180000);
    this.message('RECORDING original camera video + timestamped readings. Maximum 3 minutes. Keep this page visible.');
  }
  sample(result,at=this.now()) {
    if(!this.active||at-this.lastLog<200)return;
    this.lastLog=at;this.samples.push({t:Math.max(0,(at-this.started)/1000),rate:Number.isFinite(result.rate)?result.rate:null,reason:result.reason||'',method:result.method||null,focus:result.focus?{x:result.focus.x,y:result.focus.y}:null,diagnostics:result.diagnostics||null});
  }
  stop(reason='user') {
    if(this.finishing)return this.pending;
    if(!this.active)return Promise.resolve();
    clearTimeout(this.limit);this.stopped=this.now();this.stopReason=reason;this.active=false;this.finishing=true;
    this.pending=new Promise(resolve=>{this.resolveStop=resolve;});this.ui.state(this);
    if(this.recorder.state!=='inactive')this.recorder.stop();
    return this.pending;
  }
  download(blob,name) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async share() {
    if(!this.saved)return;
    const s=this.saved,files=[new File([s.video],s.videoName,{type:s.video.type}),new File([s.log],s.logName,{type:'application/json'})];
    if(navigator.canShare?.({files})){
      try{await navigator.share({files,title:'CPR camera test'});this.message('Share sheet closed. Confirm both files were saved or attached. The recording remains available here.');}
      catch(e){this.message(e.name==='AbortError'?'Sharing canceled. Your recording is still available.':'Sharing failed. Use Save video and Save readings log below. Your recording is still available.');}
    }else this.message('Sharing these files together is unavailable. Use Save video and Save readings log, then attach both from Files.');
  }
}
if(typeof module!=='undefined')module.exports={CPRTestRecorder};
