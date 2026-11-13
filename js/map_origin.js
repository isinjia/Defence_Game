// 내 캐릭터가 월드맵 화면 밖에 있을 때 중앙에서 방향을 안내하고 카메라만 복귀시킨다.
(() => {
  const directions=['동','남동','남','남서','서','북서','북','북동'];
  MapView.prototype.updateOriginIndicator=function(){
    const world=this.cv?.parentElement;
    if(!world||!this.cv.isConnected)return;
    let button=this._originButton;
    if(!button?.isConnected){
      button=document.createElement('button');button.className='map-origin';button.hidden=true;button.dataset.act='map-origin';
      button.innerHTML='<svg class="origin-direction" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 2 41 17 50 13 59 17Z"/></svg><span>원점으로</span>';
      world.append(button);this._originButton=button;
    }
    if(!G.player||G.over||UI.screen!=='game'||UI.ctx||UI.dlg||UI.modalOpen()) {button.hidden=true;return;}
    const actor=this.token||G.player;
    const [x,y]=this.toScreen(actor.x+.5,actor.y+.5),radius=this.tile*.5;
    const outside=x+radius<0||y+radius<0||x-radius>this.w||y-radius>this.hgt;
    button.hidden=!outside;
    if(!outside)return;
    const angle=Math.atan2(y-this.hgt/2,x-this.w/2)*180/Math.PI;
    const bearing=String(Math.round(((angle+90+360)%360)*10)/10);
    if(button.dataset.bearing!==bearing){button.dataset.bearing=bearing;button.style.setProperty('--origin-bearing',bearing+'deg');}
    const direction=directions[(Math.round(angle/45)+8)%8];
    const label=`원점으로: ${direction}쪽의 내 캐릭터 위치로 화면 이동`;
    if(button.getAttribute('aria-label')!==label){button.setAttribute('aria-label',label);button.title=label;}
  };
  const draw=MapView.prototype.draw;
  MapView.prototype.draw=function(...args){const result=draw.apply(this,args);this.updateOriginIndicator();return result;};
  const destroy=MapView.prototype.destroy;
  MapView.prototype.destroy=function(...args){this._originButton?.remove();this._originButton=null;return destroy.apply(this,args);};
  const handle=UI.handle;
  UI.handle=function(act,...args){
    if(act!=='map-origin')return handle.call(this,act,...args);
    const map=this.map;
    if(!map||this.screen!=='game'||this.ctx||this.dlg||this.modalOpen()||!G.player||G.over)return;
    const actor=map.token||G.player;
    map.centerOn(actor.x,actor.y);map.hover=-1;map.updateOriginIndicator();
  };
})();
