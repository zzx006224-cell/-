import * as THREE from 'three';

const stage=document.getElementById('card-stage');
const loading=document.getElementById('loading');
const status=document.getElementById('status');
const flipButton=document.getElementById('flip');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0,0);
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,2/3,.1,20);
camera.position.set(0,0,5.55);
const root=new THREE.Group();scene.add(root);
const plane=new THREE.PlaneGeometry(2,3);
const loader=new THREE.TextureLoader();
let config,registration,frontFoil,backFoil,lacquer,flipped=false,down=null;
let currentX=0,currentY=0,targetX=0,targetY=0,turn=0,targetTurn=0;
let pointer=new THREE.Vector2(.5,.5),active=false,last=performance.now();
const resources=['background','subject','mosque-shadow','front-original','back-original','foil-mask','back-foil-mask',
  ...['top-left','top-right','bottom-left','bottom-right'].flatMap(n=>[`corner-${n}-base`,`corner-${n}-gold`,`corner-${n}-shadow`])];

function put(mesh,z,order){
  mesh.position.z=z;
  const reference=z<0?-.036:.036;
  const distance=z<0?(5.55+z)/(5.55+reference):(5.55-z)/(5.55-reference);
  mesh.scale.setScalar(distance);
  mesh.renderOrder=order;root.add(mesh);return mesh;
}
function layer(tex,z,order,opacity=1){
  const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity,depthWrite:false,side:THREE.FrontSide,toneMapped:false});
  return put(new THREE.Mesh(plane,material),z,order);
}
function foil(tex,z,order,rear=false){
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,
    uniforms:{tMask:{value:tex},uPointer:{value:pointer},uTime:{value:0},uActive:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tMask;uniform vec2 uPointer;uniform float uTime,uActive;varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){float metal=texture2D(tMask,vUv).r;float coord=vUv.x*.82+vUv.y*.35;
        float sweep=exp(-pow((coord-(uPointer.x*.82+uPointer.y*.35))/.115,2.));
        float flow=.5+.5*sin(coord*48.-uTime*.85+uPointer.x*7.);
        float fine=pow(.5+.5*sin(coord*150.-uTime*.3),18.);
        float sparkle=step(.996,hash(floor(vUv*vec2(145.,220.))))*pow(.5+.5*sin(uTime*1.2+coord*22.),9.);
        vec3 oldGold=vec3(.43,.22,.07),amber=vec3(.67,.39,.12),champagne=vec3(1.,.82,.47);
        vec3 gold=mix(oldGold,amber,flow);gold=mix(gold,champagne,sweep*.8+fine*.16);
        float alpha=metal*(.06+flow*.075+sweep*(.22+uActive*.14)+fine*.07)+sparkle*metal*.13;
        gl_FragColor=vec4(gold,min(alpha,.43));}`});
  const mesh=put(new THREE.Mesh(plane,mat),z,order);if(rear)mesh.rotation.y=Math.PI;return mesh;
}
function clearcoat(z,order,rear=false){
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,
    uniforms:{uPointer:{value:pointer},uActive:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec2 uPointer;uniform float uActive;varying vec2 vUv;void main(){
      float d=abs((vUv.x*.9+vUv.y*.35)-(uPointer.x*.9+uPointer.y*.35));
      float sweep=exp(-pow(d/.13,2.));
      float a=sweep*(.028+uActive*.045);
      gl_FragColor=vec4(.93,.9,.78,a);}`});
  const mesh=put(new THREE.Mesh(plane,mat),z,order);if(rear)mesh.rotation.y=Math.PI;return mesh;
}
function resize(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
function point(event){const box=stage.getBoundingClientRect();return new THREE.Vector2(
  THREE.MathUtils.clamp((event.clientX-box.left)/box.width,0,1),
  THREE.MathUtils.clamp(1-(event.clientY-box.top)/box.height,0,1));}
function tilt(event){pointer.copy(point(event));targetY=(pointer.x-.5)*.48;targetX=(pointer.y-.5)*.40;active=true;}
function neutral(){targetX=0;targetY=0;active=false;}
function openWebsite(){
  const address=String(config.websiteUrl||'').trim();
  if(!/^https:\/\//i.test(address)){status.textContent='网站地址待核实；卡牌已可独立体验';return;}
  window.location.assign(address);
}
function controls(){
  stage.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')tilt(e);});
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||down)tilt(e);if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)down.moved=true;});
  stage.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!down)neutral();});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;stage.setPointerCapture(e.pointerId);down={x:e.clientX,y:e.clientY,time:performance.now(),moved:false};tilt(e);});
  stage.addEventListener('pointerup',e=>{if(!down)return;const clicked=!down.moved&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8&&performance.now()-down.time<650;down=null;if(e.pointerType!=='mouse')neutral();if(clicked)openWebsite();});
  stage.addEventListener('pointercancel',()=>{down=null;neutral();});
  stage.addEventListener('lostpointercapture',()=>{down=null;neutral();});
  stage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openWebsite();}if(e.key.toLowerCase()==='f'){e.preventDefault();flipButton.click();}});
  flipButton.addEventListener('click',()=>{flipped=!flipped;targetTurn=flipped?Math.PI:0;flipButton.firstChild.textContent=flipped?'正面 ':'翻面 ';status.textContent=flipped?'背面 · 原图文字完整保留':'正面 · 清真寺与四角独立分层';neutral();});
}
function animate(now){const dt=Math.min((now-last)/1000,.08);last=now;const ease=reduced.matches?1:1-Math.exp(-dt*9);
  currentX=THREE.MathUtils.lerp(currentX,targetX,ease);currentY=THREE.MathUtils.lerp(currentY,targetY,ease);
  turn=THREE.MathUtils.lerp(turn,targetTurn,ease);root.rotation.set(currentX,turn+currentY,0);
  const motion=Math.max(Math.abs(currentX),Math.abs(currentY));
  registration.material.opacity=flipped?0:1-THREE.MathUtils.smoothstep(motion,.01,.065);
  const strength=active?1:0;
  for(const f of [frontFoil,backFoil]){f.material.uniforms.uTime.value=reduced.matches?0:now/1000;f.material.uniforms.uActive.value=strength;}
  lacquer.material.uniforms.uActive.value=strength;
  renderer.render(scene,camera);
}
async function init(){
  config=await fetch('./card-config.json').then(r=>{if(!r.ok)throw Error('缺少 card-config.json');return r.json();});
  const textureEntries=await Promise.all(resources.map(async name=>{const tex=await loader.loadAsync(`./assets/${name}.webp`);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return [name,tex];}));
  const tex=Object.fromEntries(textureEntries);
  const edge=new THREE.MeshStandardMaterial({color:0x9b7239,metalness:.78,roughness:.3});
  const invisible=new THREE.MeshBasicMaterial({visible:false});
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.94,2.91,.065),[edge,edge,edge,edge,invisible,invisible]);base.renderOrder=0;root.add(base);
  scene.add(new THREE.AmbientLight(0xffffff,2));
  layer(tex.background,.036,1);
  layer(tex['mosque-shadow'],.085,2,.7);
  layer(tex.subject,.31,4);
  for(const [index,name] of ['top-left','top-right','bottom-left','bottom-right'].entries()){
    layer(tex[`corner-${name}-shadow`],.071,5+index*3,.65);
    layer(tex[`corner-${name}-base`],.105,6+index*3);
    layer(tex[`corner-${name}-gold`],.235,7+index*3);
  }
  registration=layer(tex['front-original'],.335,22);
  frontFoil=foil(tex['foil-mask'],.343,23);
  lacquer=clearcoat(.351,24);
  const back=layer(tex['back-original'],-.036,23);back.rotation.y=Math.PI;
  backFoil=foil(tex['back-foil-mask'],-.054,24,true);
  clearcoat(-.06,25,true);
  controls();new ResizeObserver(resize).observe(stage);resize();loading.remove();
  renderer.setAnimationLoop(animate);
  window.__card={ready:true,config,root,renderer,materials:{registration:registration.material,frontFoil:frontFoil.material,backFoil:backFoil.material}};
}
init().catch(error=>{console.error(error);loading.textContent='卡牌无法载入：'+error.message;window.__card={ready:false,error:error.message};});
