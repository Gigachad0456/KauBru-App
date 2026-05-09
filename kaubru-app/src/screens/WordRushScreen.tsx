import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, StatusBar, TouchableOpacity, Text, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dictionaryAPI, gameAPI } from '../services/api';
import { COLORS } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<any> };

// Build the full HTML game with injected word list
function buildGameHTML(words: string[]): string {
  const wordsJson = JSON.stringify(words);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>KauBru Word Rush</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #060612; }
body { display: flex; align-items: center; justify-content: center; font-family: 'Courier New', monospace; }
#game-root { position: relative; width: 100vw; height: 100vh; background: #08081a; overflow: hidden; }
canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block; }
#hud { position: absolute; top: 12px; left: 16px; right: 16px; display: flex; justify-content: space-between; pointer-events: none; }
.hud-col { display: flex; flex-direction: column; align-items: flex-start; }
.hud-col.right { align-items: flex-end; }
.hud-col.center { align-items: center; }
.hud-label { color: #334; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
.hud-val { color: #7bf; font-size: 15px; font-weight: bold; letter-spacing: 0.06em; }
#lives { display: flex; gap: 5px; margin-top: 2px; }
.life-pip { width: 8px; height: 8px; border-radius: 50%; background: #f64; box-shadow: 0 0 6px #f64; }
.life-pip.lost { background: #1a1a2a; box-shadow: none; border: 1px solid #2a2a3a; }
#typed-display { position: absolute; bottom: 14%; left: 50%; transform: translateX(-50%); color: #7bf; font-size: 18px; letter-spacing: 0.14em; font-weight: bold; pointer-events: none; min-width: 140px; text-align: center; text-shadow: 0 0 12px #7bf, 0 0 24px rgba(119,187,255,0.4); }
#hidden-input { position: absolute; opacity: 0; width: 1px; height: 1px; top: 50%; left: 50%; border: none; outline: none; background: transparent; color: transparent; font-size: 16px; }
#tap-hint { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); color: rgba(119,187,255,0.35); font-size: 11px; letter-spacing: 0.1em; pointer-events: none; }
#overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(4,4,18,0.92); }
.overlay-title { color: #7bf; font-size: 26px; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 6px; text-shadow: 0 0 20px rgba(119,187,255,0.6); }
.overlay-sub { color: #446; font-size: 12px; line-height: 1.8; text-align: center; margin-bottom: 28px; letter-spacing: 0.04em; }
.overlay-score-num { color: #fff; font-size: 42px; font-weight: bold; letter-spacing: 0.05em; text-shadow: 0 0 16px rgba(255,255,255,0.3); }
.overlay-score-label { color: #446; font-size: 11px; letter-spacing: 0.1em; margin-top: 2px; margin-bottom: 28px; }
.play-btn { background: transparent; border: 1px solid #7bf; color: #7bf; padding: 11px 32px; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: 'Courier New', monospace; letter-spacing: 0.1em; text-transform: uppercase; }
</style>
</head>
<body>
<div id="game-root">
  <canvas id="canvas"></canvas>
  <div id="hud">
    <div class="hud-col"><div class="hud-label">score</div><div class="hud-val" id="score-disp">0</div></div>
    <div class="hud-col center"><div class="hud-label">wave</div><div class="hud-val" id="wave-disp">1</div></div>
    <div class="hud-col right"><div class="hud-label">lives</div><div id="lives"></div></div>
  </div>
  <div id="typed-display"></div>
  <div id="tap-hint">TAP TO FOCUS · TYPE TO SHOOT</div>
  <input id="hidden-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" />
  <div id="overlay">
    <div class="overlay-title">WORD RUSH</div>
    <div class="overlay-sub">Type the KauBru translations to destroy enemies.<br>Don't let them reach the bottom!</div>
    <button class="play-btn" id="start-btn">▶ Start Game</button>
  </div>
</div>
<script>
const WORDS = ${wordsJson};
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const scoreDisp = document.getElementById('score-disp');
const waveDisp = document.getElementById('wave-disp');
const livesEl = document.getElementById('lives');
const typedDisp = document.getElementById('typed-display');
const hiddenInput = document.getElementById('hidden-input');

let W, H, visibleH;
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  visibleH = window.visualViewport ? window.visualViewport.height : H;
  canvas.width = W;
  canvas.height = H;
}
resize();
window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', function() {
    visibleH = window.visualViewport.height;
  });
}

const MAX_LIVES = 3;
let state = 'idle';
let enemies = [], particles = [], bullets = [], stars = [];
let score = 0, lives = MAX_LIVES, wave = 1;
let typed = '', target = null;
let spawnTimer = 0, spawnInterval = 110;
let waveTimer = 0;
let animId = null;
let playerX = W / 2;
let screenShake = 0;
let sessionScore = 0;

function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()<0.2?1.2:0.6, alpha: 0.1+Math.random()*0.5, twinkle: Math.random()*Math.PI*2, speed: 0.002+Math.random()*0.003 });
  }
}

function randWord() { return WORDS[Math.floor(Math.random()*WORDS.length)]; }
function ensureUnique(w) {
  const used = new Set(enemies.map(e=>e.word));
  let tries=0;
  while(used.has(w)&&tries<30){w=randWord();tries++;}
  return w;
}
function renderLives() {
  livesEl.innerHTML='';
  for(let i=0;i<MAX_LIVES;i++){const d=document.createElement('div');d.className='life-pip'+(i>=lives?' lost':'');livesEl.appendChild(d);}
}
function spawnEnemy() {
  const word=ensureUnique(randWord());
  const margin=50;
  const x=margin+Math.random()*(W-margin*2);
  const baseSpeed=0.38+wave*0.07;
  const speed=baseSpeed+Math.random()*0.25;
  enemies.push({word,x,y:-24,speed,typed:0,hitTimer:0,wobble:Math.random()*Math.PI*2,wobbleSpeed:0.01+Math.random()*0.01,wobbleAmt:0.4+Math.random()*0.6});
}
function spawnParticles(x,y,color,count=14){
  for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;const s=0.8+Math.random()*3.5;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:0.025+Math.random()*0.025,r:1+Math.random()*2,color});}
}
function spawnBullet(x,y,tx,ty){
  const dx=tx-x,dy=ty-y;const d=Math.hypot(dx,dy)||1;
  bullets.push({x,y,vx:dx/d*9,vy:dy/d*9,life:1});
}
function update(){
  if(state!=='playing')return;
  if(screenShake>0)screenShake-=0.5;
  for(const s of stars){s.twinkle+=s.speed*60;s.y+=0.15;if(s.y>H){s.y=0;s.x=Math.random()*W;}}
  spawnTimer++;waveTimer++;
  if(spawnTimer>=spawnInterval){spawnTimer=0;spawnEnemy();if(enemies.length<2+Math.floor(wave*0.5))spawnEnemy();}
  if(waveTimer>700){wave++;waveTimer=0;spawnInterval=Math.max(35,110-wave*9);waveDisp.textContent=wave;}
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];e.wobble+=e.wobbleSpeed;e.y+=e.speed;if(e.hitTimer>0)e.hitTimer--;
    if(e.y>visibleH*0.9){if(target===e){target=null;typed='';typedDisp.textContent='';hiddenInput.value='';}enemies.splice(i,1);lives--;renderLives();screenShake=8;spawnParticles(e.x,visibleH*0.88,'#f64',20);if(lives<=0){endGame();return;}}
  }
  for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx;b.y+=b.vy;b.life-=0.025;if(b.life<=0||b.y<-10)bullets.splice(i,1);}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.91;p.vy*=0.91;p.life-=p.decay;if(p.life<=0)particles.splice(i,1);}
  playerX+=((target?target.x:W/2)-playerX)*0.055;
}
function drawShip(x,y,size,color,glowColor){
  ctx.save();ctx.translate(x,y);ctx.shadowColor=glowColor;ctx.shadowBlur=14;ctx.fillStyle=color;
  ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*0.55,size*0.55);ctx.lineTo(0,size*0.1);ctx.lineTo(-size*0.55,size*0.55);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.moveTo(0,-size*0.7);ctx.lineTo(size*0.2,0);ctx.lineTo(0,-size*0.1);ctx.closePath();ctx.fill();ctx.restore();
}
function drawPlayer(x){
  const y=visibleH*0.88;ctx.save();ctx.translate(x,y);ctx.shadowColor='#7bf';ctx.shadowBlur=16;ctx.fillStyle='#7bf';
  ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(10,8);ctx.lineTo(4,3);ctx.lineTo(0,7);ctx.lineTo(-4,3);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(4,2);ctx.lineTo(0,-2);ctx.closePath();ctx.fill();
  ctx.shadowBlur=28;ctx.fillStyle='rgba(119,187,255,0.12)';ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.restore();
}
function draw(){
  const shakeX=screenShake>0?(Math.random()-0.5)*screenShake:0;
  const shakeY=screenShake>0?(Math.random()-0.5)*screenShake:0;
  ctx.save();ctx.translate(shakeX,shakeY);
  ctx.fillStyle='#08081a';ctx.fillRect(-10,-10,W+20,H+20);
  for(const s of stars){const a=s.alpha*(0.5+0.5*Math.sin(s.twinkle));ctx.fillStyle=\`rgba(180,210,255,\${a})\`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
  for(const b of bullets){ctx.save();ctx.globalAlpha=b.life*0.9;ctx.shadowColor='#ffd080';ctx.shadowBlur=8;ctx.fillStyle='#ffe090';ctx.fillRect(b.x-1.5,b.y-5,3,10);ctx.restore();}
  for(const e of enemies){
    const isTarget=e===target;const hitFlash=e.hitTimer>0;const wobX=Math.sin(e.wobble)*e.wobbleAmt;
    const color=hitFlash?'#ffffff':(isTarget?'#ffaa55':'#dd5555');const glow=isTarget?'#ff8833':'#aa2222';
    drawShip(e.x+wobX,e.y,13,color,glow);
    ctx.font="bold 11px 'Courier New', monospace";
    const fullW=ctx.measureText(e.word).width;const px=e.x+wobX,py=e.y+22;
    const bx=px-fullW/2-7,bw=fullW+14,bh=18;
    ctx.fillStyle=isTarget?'rgba(60,25,5,0.88)':'rgba(12,8,22,0.82)';
    ctx.strokeStyle=isTarget?'rgba(255,140,50,0.8)':'rgba(80,50,80,0.5)';ctx.lineWidth=isTarget?0.8:0.5;
    ctx.beginPath();ctx.roundRect(bx,py-13,bw,bh,3);ctx.fill();ctx.stroke();
    const done=e.word.slice(0,e.typed);const rest=e.word.slice(e.typed);const doneW=ctx.measureText(done).width;
    const textX=bx+7,textY=py;
    ctx.fillStyle=isTarget?'#ffaa44':'#886688';ctx.fillText(done,textX,textY);
    ctx.fillStyle=isTarget?'#ffffff':'#ccbbcc';ctx.fillText(rest,textX+doneW,textY);
    if(isTarget&&e.typed>0){ctx.fillStyle='rgba(255,150,50,0.6)';ctx.fillRect(textX,textY+2,doneW,1.5);}
  }
  for(const p of particles){ctx.save();ctx.globalAlpha=p.life*0.85;ctx.shadowColor=p.color;ctx.shadowBlur=6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(state==='playing'){
    drawPlayer(playerX);
    if(target){ctx.save();ctx.strokeStyle='rgba(119,187,255,0.12)';ctx.lineWidth=0.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(playerX,visibleH*0.88-16);ctx.lineTo(target.x,target.y+14);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(119,187,255,0.06)';ctx.lineWidth=0.5;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(0,visibleH*0.88+10);ctx.lineTo(W,visibleH*0.88+10);ctx.stroke();
  }
  ctx.restore();
}
function loop(){update();draw();animId=requestAnimationFrame(loop);}
function startGame(){
  enemies=[];particles=[];bullets=[];score=0;lives=MAX_LIVES;wave=1;
  typed='';target=null;spawnTimer=0;spawnInterval=110;waveTimer=0;screenShake=0;playerX=W/2;
  scoreDisp.textContent='0';waveDisp.textContent='1';typedDisp.textContent='';hiddenInput.value='';
  renderLives();initStars();overlay.style.display='none';state='playing';
  spawnEnemy();if(animId)cancelAnimationFrame(animId);loop();
  setTimeout(()=>hiddenInput.focus(),100);
}
function endGame(){
  state='gameover';
  try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'gameOver',score,wave})); } catch(e){}
  overlay.style.display='flex';
  overlay.innerHTML=\`<div class="overlay-title">GAME OVER</div><div class="overlay-score-num">\${score.toLocaleString()}</div><div class="overlay-score-label">WAVE \${wave} &nbsp;·&nbsp; FINAL SCORE</div><button class="play-btn" id="start-btn">↺ Play Again</button>\`;
  document.getElementById('start-btn').onclick=startGame;
}
function handleChar(ch){
  if(state!=='playing')return;
  ch=ch.toLowerCase();
  if(!target){
    const matches=enemies.filter(en=>en.word[0]===ch);
    if(matches.length>0){
      target=matches.reduce((a,b)=>a.y>b.y?a:b);
      typed=ch;target.typed=1;typedDisp.textContent=typed;
      spawnBullet(playerX,visibleH*0.88-16,target.x,target.y);
      if(target.typed>=target.word.length)destroyTarget();
    }
  } else {
    if(ch===target.word[target.typed]){
      target.typed++;target.hitTimer=4;typed+=ch;typedDisp.textContent=typed;
      spawnBullet(playerX,visibleH*0.88-16,target.x,target.y);
      if(target.typed>=target.word.length)destroyTarget();
    }
  }
}
function handleBackspace(){
  if(typed.length>0){typed=typed.slice(0,-1);if(target)target.typed=Math.max(0,target.typed-1);if(typed.length===0)target=null;typedDisp.textContent=typed;}
}
function destroyTarget(){
  spawnParticles(target.x,target.y,'#ffaa44',16);spawnParticles(target.x,target.y,'#ff6622',8);
  score+=target.word.length*10*wave;scoreDisp.textContent=score.toLocaleString();
  const idx=enemies.indexOf(target);if(idx!==-1)enemies.splice(idx,1);
  target=null;typed='';typedDisp.textContent='';hiddenInput.value='';
}
// Hidden input handling — captures keyboard on mobile
hiddenInput.addEventListener('input',function(){
  const val=this.value;
  if(!val)return;
  const lastChar=val[val.length-1];
  if(/[a-zA-Z]/.test(lastChar)){handleChar(lastChar);}
  this.value=typed;
});
hiddenInput.addEventListener('keydown',function(e){
  if(e.key==='Backspace'){e.preventDefault();handleBackspace();this.value=typed;}
  if(e.key==='Escape'){typed='';target=null;typedDisp.textContent='';this.value='';}
});
// Tap anywhere on canvas to focus the hidden input
document.getElementById('game-root').addEventListener('click',function(){
  hiddenInput.focus();
});
// Stars idle animation
initStars();
(function idleLoop(){
  if(state==='idle'){
    for(const s of stars){s.twinkle+=s.speed*60;s.y+=0.12;if(s.y>H){s.y=0;s.x=Math.random()*W;}}
    ctx.fillStyle='#08081a';ctx.fillRect(0,0,W,H);
    for(const s of stars){const a=s.alpha*(0.5+0.5*Math.sin(s.twinkle));ctx.fillStyle=\`rgba(180,210,255,\${a})\`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
    requestAnimationFrame(idleLoop);
  }
})();
renderLives();
document.getElementById('start-btn').onclick=startGame;
</script>
</body>
</html>`;
}

export default function WordRushScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    try {
      const res = await dictionaryAPI.getAll(0, 200);
      // Use English words as the "enemy" words to type
      const wordList: string[] = res.data
        .map((w: any) => w.english?.toLowerCase().trim())
        .filter((w: string) => w && w.length >= 2 && w.length <= 12 && /^[a-z]+$/.test(w));
      if (wordList.length < 5) throw new Error('Not enough words');
      setWords(wordList);
    } catch {
      // Fallback to a small default list
      setWords(['hello','water','fire','earth','wind','tree','house','food','love','peace','river','mountain','sky','sun','moon','star','bird','fish','flower','stone']);
    } finally {
      setLoading(false);
    }
  }

  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'gameOver') {
        // Submit score to backend
        gameAPI.awardPoints({
          session_id: `wordrush_${Date.now()}`,
          points: data.score,
        }).catch(() => {});
      }
    } catch {}
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#060612" />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#7bf" />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#7bf" size="large" />
          <Text style={styles.loadingText}>Loading words...</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: buildGameHTML(words) }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          keyboardDisplayRequiresUserAction={false}
          automaticallyAdjustContentInsets={false}
          contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
          softwareKeyboardLayoutMode="pan"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060612',
  },
  webview: {
    flex: 1,
    backgroundColor: '#060612',
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(119,187,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(119,187,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#7bf',
    fontSize: 14,
    fontFamily: 'Courier New',
  },
});
