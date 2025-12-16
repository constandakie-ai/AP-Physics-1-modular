// === GLOBAL ENGINE ===
const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');
let currentSim = null;
let animId = null;
let state = {};

function toggleMenu(id) {
    document.getElementById(id).classList.toggle('open');
}

function stopSim() {
    if(animId) cancelAnimationFrame(animId);
    animId = null;
}

// === HELPER: DRAW ARROW ===
function drawVector(x, y, dx, dy, color) {
    let head = 10;
    let angle = Math.atan2(dy, dx);
    let len = Math.sqrt(dx*dx + dy*dy);
    if(len < 1) return; // Don't draw tiny arrows
    
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(x+dx, y+dy);
    ctx.lineTo(x+dx - head*Math.cos(angle-Math.PI/6), y+dy - head*Math.sin(angle-Math.PI/6));
    ctx.lineTo(x+dx - head*Math.cos(angle+Math.PI/6), y+dy - head*Math.sin(angle+Math.PI/6));
    ctx.fill();
}

// === SIMULATION LOADER ===
function loadSim(id) {
    stopSim();
    currentSim = id;
    document.getElementById('sim-interface').classList.remove('hidden');
    
    // Clear styles
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active'); 

    // THE SWITCH
    switch(id) {
        // You will paste your other cases here...
        // case '1.1': setup_1_1(); break;
        
        case '2.4': setup_2_4(); break;
        case '5.1': setup_5_1(); break;
    }
}

// ===============================================
// === PASTE YOUR SIMULATIONS BELOW THIS LINE ===
// ===============================================

// ===============================================
    // === UNIT 2.4: STATIC VS KINETIC FRICTION (FINAL v26 - AP MASTERY) ===
    // ===============================================
    function setup_2_4() {
        canvas.height = 600; 

        document.getElementById('sim-title').innerText = "2.4 Static vs. Kinetic Friction";
        document.getElementById('sim-desc').innerHTML = `
            <h3>The Friction "Hump"</h3>
            <p><b>Static Friction</b> matches Applied Force up to a limit. <b>Kinetic Friction</b> is constant.
            <br><i><b>Mission:</b> Answer the questions below to unlock controls and earn the Mastery Badge!</i></p>`;

        document.getElementById('sim-controls').innerHTML = `
            <div style="background:#eef2f3; padding:10px; border-radius:5px; margin-bottom:15px; border:1px solid #ccc; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <label style="font-weight:bold; margin-right:15px;">Mode:</label>
                    <label style="margin-right:15px; cursor:pointer;">
                        <input type="radio" name="sim-mode" value="guided" checked onchange="setMode_2_4('guided')"> Guided Lab
                    </label>
                    <label style="cursor:pointer;">
                        <input type="radio" name="sim-mode" value="challenge" onchange="setMode_2_4('challenge')"> Full Version
                    </label>
                </div>
                <div id="mastery-badge" style="display:none; font-weight:bold; color:#f39c12; font-family:sans-serif;">
                    <span style="font-size:1.5em;">&#9733;</span> AP MASTER
                </div>
            </div>

            <div class="control-group">
                <label>Block Mass (<i class="var">m</i>): <span id="v-m">5.0</span> kg</label>
                <input type="range" id="in-m" class="phys-slider" min="1.0" max="10.0" step="0.5" value="5.0" 
                    oninput="updateState_2_4('m', this.value)">
            </div>
            <div class="control-group">
                <label>Static Coeff (<i class="var">&mu;<sub>s</sub></i>): <span id="v-mus">0.6</span></label>
                <input type="range" id="in-mus" class="phys-slider" min="0.1" max="1.0" step="0.05" value="0.6" 
                    oninput="updateState_2_4('mu_s', this.value)">
            </div>
            <div class="control-group">
                <label>Kinetic Coeff (<i class="var">&mu;<sub>k</sub></i>): <span id="v-muk">0.4</span></label>
                <input type="range" id="in-muk" class="phys-slider" min="0.1" max="1.0" step="0.05" value="0.4" 
                    oninput="updateState_2_4('mu_k', this.value)">
            </div>
            <div class="control-group">
                <label>Applied Force (<i class="var">F<sub>app</sub></i>): <span id="v-fa">0</span> N</label>
                <input type="range" id="in-fa" class="phys-slider" min="0" max="100" value="0" step="0.5" 
                    oninput="state.Fa=parseFloat(this.value);">
            </div>
            
            <div class="control-group" style="margin-top:10px;">
                <label>Simulation Speed:</label>
                <div style="display:flex; gap:15px; margin-top:5px;">
                    <label style="font-weight:normal;"><input type="radio" name="spd" value="1" checked onclick="state.timeScale=1"> Regular</label>
                    <label style="font-weight:normal;"><input type="radio" name="spd" value="0.1" onclick="state.timeScale=0.1"> Slow Motion</label>
                </div>
            </div>

            <div style="margin-top:15px; padding:15px; background:#fff; border:1px solid #ddd; border-radius:4px; font-family:'Times New Roman', serif;">
                <div id="eq-x" style="margin-bottom:12px; height:35px; display:flex; align-items:center; font-size:1.1em;"></div>
                <div id="eq-y" style="height:35px; display:flex; align-items:center; font-size:1.1em;"></div>
            </div>

            <div style="margin-top:10px; padding:10px; background:#f8f9fa; border-radius:4px; font-size: 0.9em;">
                <div>Status: <span id="out-stat" style="font-weight:bold; color:#c0392b;">Static</span></div>
                <div>Friction (<i class="var">f</i>): <span id="out-ff">0.0</span> N</div>
            </div>
            <button class="btn btn-red" onclick="reset_2_4()" style="margin-top:15px;">Reset Graph</button>
            
            <div id="questions-section" style="margin-top:20px; border-top:2px solid #eee; padding-top:15px; background:#fafafa; padding:15px; border-radius:5px;">
                </div>
        `;
        reset_2_4();
    }

    function updateState_2_4(key, val) {
        state[key] = parseFloat(val);
        if(key==='m') document.getElementById('v-m').innerText = state.m.toFixed(1);
        if(key==='mu_s') document.getElementById('v-mus').innerText = state.mu_s.toFixed(2);
        if(key==='mu_k') document.getElementById('v-muk').innerText = state.mu_k.toFixed(2);
    }

    function setMode_2_4(mode) {
        state.mode = mode;
        const qDiv = document.getElementById('questions-section');
        const badge = document.getElementById('mastery-badge');
        
        // Ensure badge visibility persists if earned
        if(state.level >= 6) badge.style.display = 'block';

        if(mode === 'challenge') {
            qDiv.style.display = 'none';
        } else {
            qDiv.style.display = 'block';
            // Only reset to 0 if we haven't started. If they are on Q4, keep them there.
            if(state.level < 0) state.level = 0;
            renderQuestions_2_4();
        }
        updateLocks_2_4();
    }

    function updateLocks_2_4() {
        // LOCKS:
        // Level 0: Lock Mass, Mus, Muk
        // Level 1: Lock Mus, Muk (Unlock Mass)
        // Level 2+: Unlock All (Full Version / Mastery)
        
        let lockM = (state.level < 1);
        let lockMu = (state.level < 2);
        
        // In challenge mode OR if Mastery levels reached (Level 3+), physics is unlocked
        if(state.mode === 'challenge' || state.level >= 2) { lockM = false; lockMu = false; }

        let setLock = (id, locked) => {
            let el = document.getElementById(id);
            // "Smart Lock" - only lock if moving? 
            // The prompt implied the controls unlock permanently after Q3.
            // But we keep the "Lock while moving" safety for guided mode, 
            // UNLESS we are in the Mastery Levels (3+), where we need to brake.
            
            // Logic: If in guided mode levels 0-2, we enforce strict locks.
            // If in Mastery (3+), we unlock everything so they can do the hard questions.
            el.disabled = locked;
            el.style.opacity = locked ? "0.4" : "1.0";
            el.style.cursor = locked ? "not-allowed" : "pointer";
        };

        setLock('in-m', lockM);
        setLock('in-mus', lockMu);
        setLock('in-muk', lockMu);
    }

    function checkAnswer_2_4(qIdx) {
        let val = parseFloat(document.getElementById('ans-'+qIdx).value);
        let correct = false;
        let feedback = "";
        let tol = 0.5;

        // --- TUTORIAL LEVELS (0-2) ---
        if(qIdx === 0) { // Max Static
            let target = state.mu_s * state.m * 9.8;
            if(Math.abs(val - target) < tol) correct = true;
        } 
        else if(qIdx === 1) { // Kinetic Friction
            let target = state.mu_k * state.m * 9.8;
            if(Math.abs(val - target) < tol) correct = true;
        }
        else if(qIdx === 2) { // Intro Acceleration
            let fk = state.mu_k * state.m * 9.8;
            let target = (state.Fa - fk) / state.m;
            if(state.Fa <= state.mu_s * state.m * 9.8) target = 0;
            if(Math.abs(val - target) < 0.2) correct = true;
        }
        // --- MASTERY LEVELS (3-5) ---
        else if(qIdx === 3) { 
            // Q: Constant Velocity Force
            // Fapp must equal Fk.
            let target = state.mu_k * state.m * 9.8;
            if(Math.abs(val - target) < tol) correct = true;
        }
        else if(qIdx === 4) { 
            // Q: Braking Acceleration (Negative)
            // User sets Fapp < Fk. a = (Fapp - Fk)/m
            let fk = state.mu_k * state.m * 9.8;
            let target = (state.Fa - fk) / state.m;
            // It must be moving for this to be valid
            if(Math.abs(state.v) < 0.01) feedback = " (Get it moving first!)";
            else if(Math.abs(val - target) < 0.2) correct = true;
        }
        else if(qIdx === 5) { 
            // Q: The Static Trap
            // If stationary, Friction = Fapp. NOT mu*Fn.
            if(Math.abs(state.v) > 0.01) feedback = " (Stop the block first!)";
            else {
                let fsMax = state.mu_s * state.m * 9.8;
                if(state.Fa > fsMax) feedback = " (It's slipping! Lower the force.)";
                else {
                    let target = state.Fa; // Newton's 1st Law
                    let trap = fsMax;
                    if(Math.abs(val - trap) < tol && Math.abs(val - target) > tol) 
                        feedback = " (Careful! Is it at the limit?)";
                    else if(Math.abs(val - target) < tol) correct = true;
                }
            }
        }

        let fbEl = document.getElementById('fb-'+qIdx);
        if(correct) {
            fbEl.innerHTML = "<span style='color:green; font-weight:bold;'>Correct!</span>";
            
            // Level Up Logic
            if(state.level === qIdx) state.level++;
            
            if(state.level >= 6) {
                document.getElementById('mastery-badge').style.display = 'block';
            }
            
            setTimeout(renderQuestions_2_4, 1000); 
            updateLocks_2_4();
        } else {
            fbEl.innerHTML = "<span style='color:red'>Try again." + feedback + "</span>";
        }
    }

    function renderQuestions_2_4() {
        let div = document.getElementById('questions-section');
        
        // --- TUTORIAL PHASE ---
        if(state.level === 0) {
            div.innerHTML = `
                <h4>Level 1: Static Limits</h4>
                <p>Current Mass: <b>${state.m} kg</b> | &mu;<sub>s</sub>: <b>${state.mu_s}</b></p>
                <p>Calculate the <b>Maximum Static Friction</b> force possible before it slips.</p>
                <input type="number" id="ans-0" placeholder="Newtons" style="width:80px; padding:5px;">
                <button class="btn btn-green" style="width:auto; display:inline-block;" onclick="checkAnswer_2_4(0)">Check</button>
                <span id="fb-0" style="margin-left:10px;"></span>
                <p style="font-size:0.85em; color:#666;"><i>Reward: Unlock Mass Slider</i></p>
            `;
        } else if(state.level === 1) {
            div.innerHTML = `
                <h4>Level 2: Kinetic Friction</h4>
                <p>Current Mass: <b>${state.m} kg</b> | &mu;<sub>k</sub>: <b>${state.mu_k}</b></p>
                <p>If the block is sliding, what is the constant <b>Kinetic Friction</b> force?</p>
                <input type="number" id="ans-1" placeholder="Newtons" style="width:80px; padding:5px;">
                <button class="btn btn-green" style="width:auto; display:inline-block;" onclick="checkAnswer_2_4(1)">Check</button>
                <span id="fb-1" style="margin-left:10px;"></span>
                <p style="font-size:0.85em; color:#666;"><i>Reward: Unlock All Coefficients</i></p>
            `;
        } else if(state.level === 2) {
            div.innerHTML = `
                <h4>Level 3: Newton's 2nd Law</h4>
                <p>Set F<sub>app</sub> to <b>${state.Fa} N</b>.</p>
                <p>Based on current Mass (${state.m}kg) and &mu;<sub>k</sub> (${state.mu_k}), calculate the <b>Acceleration</b>.</p>
                <input type="number" id="ans-2" placeholder="m/s²" style="width:80px; padding:5px;">
                <button class="btn btn-green" style="width:auto; display:inline-block;" onclick="checkAnswer_2_4(2)">Check</button>
                <span id="fb-2" style="margin-left:10px;"></span>
                <p style="font-size:0.85em; color:#666;"><i>Reward: Unlock Full Version</i></p>
            `;
        } 
        
        // --- MASTERY PHASE ---
        else if(state.level === 3) {
            div.innerHTML = `
                <h4 style="color:#d35400;">AP Mastery Q1: Constant Velocity</h4>
                <p>Adjust F<sub>app</sub> so the block moves at <b>constant velocity</b> (a=0).</p>
                <p>What Applied Force is required?</p>
                <input type="number" id="ans-3" placeholder="Newtons" style="width:80px; padding:5px;">
                <button class="btn btn-green" style="width:auto; display:inline-block;" onclick="checkAnswer_2_4(3)">Check</button>
                <span id="fb-3" style="margin-left:10px;"></span>
            `;
        } else if(state.level === 4) {
             div.innerHTML = `
                <h4 style="color:#d35400;">AP Mastery Q2: The Brakes</h4>
                <p>Get the block moving, then increase &mu;<sub>k</sub> so friction is larger than F<sub>app</sub>.</p>
                <p>Calculate the <b>deceleration</b> (negative acceleration) at this moment.</p>
                <input type="number" id="ans-4" placeholder="m/s²" style="width:80px; padding:5px;">
                <button class="btn btn-green" style="width:auto; display:inline-block;" onclick="checkAnswer_2_4(4)">Check</button>
                <span id="fb-4" style="margin-left:10px;"></span>
            `;
        } else if(state.level === 5) {
             div.innerHTML = `
                <h4 style="color:#c0392b;">AP Mastery Q3: The Static Trap</h4>
                <p><b>Stop the block.</b> Set &mu;<sub>s</sub>=${state.mu_s}. Set F<sub>app</sub> to <b>10 N</b>.</p>
                <p>What is the exact magnitude of the <b>Friction Force</b>?</p>
                <input type="number" id="ans-5" placeholder="Newtons" style="width:80px; padding:5px;">
                <button class="btn btn-green" style="width:auto; display:inline-block;" onclick="checkAnswer_2_4(5)">Check</button>
                <span id="fb-5" style="margin-left:10px;"></span>
                <p style="font-size:0.85em; color:#666;"><i>Hint: Check the "Impossible Zone"</i></p>
            `;
        } else {
            div.innerHTML = `
                <h3 style="color:#f39c12;">&#9733; AP PHYSICS MASTER &#9733;</h3>
                <p>You have completed all challenges. You understand the difference between static limits, kinetic constant, and Newton's laws!</p>
                <p><i>The badge at the top is yours.</i></p>
            `;
        }
    }

    function reset_2_4() {
        state = {
            Fa: parseFloat(document.getElementById('in-fa').value), 
            m: parseFloat(document.getElementById('in-m').value), 
            mu_s: parseFloat(document.getElementById('in-mus').value), 
            mu_k: parseFloat(document.getElementById('in-muk').value),
            v: 0, x: 0,
            graphData: [],
            running: true,
            lastFa: -1,
            lastFriction: -1, 
            timeScale: document.querySelector('input[name="spd"]:checked').value,
            maxFriction: 100,
            mode: document.querySelector('input[name="sim-mode"]:checked').value,
            level: 0 
        };
        
        // Initial setup
        if(state.mode === 'challenge') {
             // If they switch to challenge, they can play freely, but it doesn't solve questions.
        }
        setMode_2_4(state.mode);
        
        loop_2_4(); 
    }

    function loop_2_4() {
        if(currentSim !== '2.4') return; 
        
        document.getElementById('v-fa').innerText = state.Fa;
        
        // Physics Calc
        let Fn = state.m * 9.8;
        let fs_max = state.mu_s * Fn;
        let fk = state.mu_k * Fn;
        
        let friction = 0;
        let Fnet = 0;
        let status = "static";
        
        // --- PHYSICS STATE MACHINE ---
        if (Math.abs(state.v) < 0.001) {
            // === STATIC REGION ===
            let limit = Math.max(fs_max, fk); 
            
            if (state.Fa <= limit) {
                friction = state.Fa; 
                Fnet = 0;
                state.v = 0;
                status = "static";
                document.getElementById('out-stat').innerText = "Static (Stuck)";
                document.getElementById('out-stat').style.color = "#c0392b";
            } else {
                state.v = 0.01; 
                friction = fk; 
                status = "kinetic";
            }
        } else {
            // === KINETIC REGION ===
            friction = fk; 
            status = "kinetic";
            
            if (state.Fa < fk) Fnet = state.Fa - fk;
            else Fnet = state.Fa - fk;
            
            document.getElementById('out-stat').innerText = "Kinetic (Sliding)";
            document.getElementById('out-stat').style.color = "#27ae60";
            
            let a = Fnet / state.m;
            let dt = 0.1 * state.timeScale; 
            state.v += a * dt; 
            state.x += state.v * dt;
            
            // STOP TRAP
            if (state.v <= 0) {
                state.v = 0;
                if (state.Fa <= fs_max || state.Fa <= fk) {
                    status = "static";
                    friction = state.Fa; 
                    Fnet = 0;            
                    document.getElementById('out-stat').innerText = "Static (Stuck)";
                    document.getElementById('out-stat').style.color = "#c0392b";
                }
            }
        }
        
        // --- DYNAMIC LOCKING ---
        let sliders = document.querySelectorAll('.phys-slider');
        // Lock only if in Guided Mode (Levels 0-2) AND moving.
        // Once we hit Level 3 (Mastery), we unlock so they can do braking experiments.
        let shouldLock = (state.mode === 'guided' && state.level < 3 && Math.abs(state.v) > 0.001);
        
        sliders.forEach(s => {
            s.disabled = shouldLock;
            s.style.opacity = shouldLock ? "0.5" : "1.0";
        });

        document.getElementById('out-ff').innerText = friction.toFixed(1);
        
        // --- EQUATION BUILDER ---
        let getFs = (val, max) => {
            let s = 14 + (Math.abs(val) / max) * 20; 
            if(s > 34) s = 34;
            return s + "px";
        };

        let sizeFa = getFs(state.Fa, 100);
        let sizeFf = getFs(friction, 100);
        
        let fricVar = (status === 'static') ? "f<sub>s</sub>" : "f<sub>k</sub>";
        const subStyle = 'font-size:0.75em; vertical-align:-0.25em;';

        // Equation X
        let htmlX = `&Sigma;<i>F</i><span style="${subStyle}">x</span> &nbsp;=&nbsp;&nbsp; 
            <span style="font-size:${sizeFa}; font-weight:bold; color:black; transition: font-size 0.1s;">F<sub>app</sub></span> 
            &nbsp;&nbsp;&minus;&nbsp;&nbsp; 
            <span style="font-size:${sizeFf}; font-weight:bold; color:#c0392b; transition: font-size 0.1s;">${fricVar}</span> 
            &nbsp;&nbsp;=&nbsp;&nbsp; ${Fnet.toFixed(1)} N`;
        document.getElementById('eq-x').innerHTML = htmlX;

        // Equation Y
        let sizeFy = getFs(state.m, 10); 
        let htmlY = `&Sigma;<i>F</i><span style="${subStyle}">y</span> &nbsp;=&nbsp;&nbsp; 
            <span style="font-size:${sizeFy}; font-weight:bold; color:blue; transition: font-size 0.1s;">F<sub>n</sub></span> 
            &nbsp;&nbsp;&minus;&nbsp;&nbsp; 
            <span style="font-size:${sizeFy}; font-weight:bold; color:green; transition: font-size 0.1s;">F<sub>g</sub></span> 
            &nbsp;&nbsp;=&nbsp;&nbsp; 0`;
        document.getElementById('eq-y').innerHTML = htmlY;

        // Graphing Data Push
        if(state.Fa !== state.lastFa || Math.abs(friction - state.lastFriction) > 0.1) {
             state.graphData.push({x: state.Fa, y: friction});
             state.lastFa = state.Fa;
             state.lastFriction = friction;
        }
        
        draw_2_4(friction, Fn, status, fk, fs_max);
        animId = requestAnimationFrame(loop_2_4);
    }

    function draw_2_4(fVal, Fn, status, fk, fs_max) {
        ctx.clearRect(0,0,700,600); 
        
        // --- VISUALS ---
        let floorY = 160; 
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(0,0,700,200); 
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0,floorY,700,100); 
        
        let drawX = 150 + (state.x % 400); 
        let size = 30 + state.m * 4; 
        let by = floorY - size;
        
        // Block
        ctx.fillStyle = "#e67e22"; ctx.fillRect(drawX, by, size, size);
        ctx.strokeStyle = "#d35400"; ctx.lineWidth=2; ctx.strokeRect(drawX, by, size, size);
        ctx.fillStyle = "white"; ctx.font = "bold 12px serif"; ctx.textAlign="center";
        ctx.fillText(state.m+"kg", drawX + size/2, by + size/2 + 4);

        // --- VECTORS ---
        let cx = drawX + size/2;
        let cy = by + size/2;
        let vectorScale = 0.6; 
        
        function drawLabel(main, sub, x, y, color) {
            ctx.fillStyle = color;
            ctx.font = "bold 14px serif";
            let mw = ctx.measureText(main).width;
            ctx.fillText(main, x, y);
            ctx.font = "bold 10px serif";
            ctx.fillText(sub, x + mw, y + 5);
        }

        // Vectors
        let fgLen = (state.m * 9.8) * vectorScale; 
        drawVector(cx, cy + size/2, 0, fgLen, "green"); 
        drawLabel("F", "g", cx+5, cy + size/2 + fgLen + 10, "black");

        let fnLen = fgLen; 
        drawVector(cx, cy - size/2, 0, -fnLen, "blue");
        drawLabel("F", "n", cx+5, cy - size/2 - fnLen - 5, "black");

        if(state.Fa > 0) {
            let faLen = state.Fa * 1.5; 
            drawVector(cx + size/2, cy, faLen, 0, "black");
            drawLabel("F", "app", cx + size/2 + faLen + 10, cy+4, "black");
        }

        if(fVal > 0) {
            let fLen = fVal * 1.5;
            drawVector(cx - size/2, cy, -fLen, 0, "red");
            let labelChar = (status === 'static') ? "s" : "k";
            let labelX = cx - size/2 - fLen - 20;
            let labelY = cy+4;
            drawLabel("f", labelChar, labelX, labelY, "black");
        }

        // --- MICROSCOPIC VIEW ---
        let bubbleX = 100; 
        let bubbleY = 60;  
        let r = 45;
        ctx.strokeStyle = "#7f8c8d"; ctx.lineWidth=1; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(bubbleX, bubbleY + r); ctx.lineTo(drawX + size/2, floorY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(bubbleX, bubbleY, r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#333"; ctx.lineWidth=3; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.rect(bubbleX-r, bubbleY-r, 2*r, 2*r); ctx.clip(); 
        ctx.strokeStyle = "#e67e22"; ctx.lineWidth=3; 
        let offset = (state.x * 20) % 20; 
        ctx.beginPath();
        for(let i=-r; i<r; i+=10) { ctx.lineTo(bubbleX + i - offset, bubbleY - 5); ctx.lineTo(bubbleX + i + 5 - offset, bubbleY + 5); } ctx.stroke();
        ctx.strokeStyle = "#7f8c8d"; 
        ctx.beginPath();
        for(let i=-r; i<r; i+=10) { ctx.lineTo(bubbleX + i, bubbleY + 2); ctx.lineTo(bubbleX + i + 5, bubbleY + 12); } ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#555"; ctx.font="10px sans-serif";
        ctx.fillText("Microscopic View", bubbleX, bubbleY - r - 5);

        // --- GRAPH ---
        let gy = 280; let gh = 250; let gx = 60; let gw = 600;
        
        ctx.fillStyle = "white"; ctx.fillRect(0, 260, 700, 340);
        
        // 0. DRAW IMPOSSIBLE ZONE
        ctx.beginPath();
        ctx.moveTo(gx, gy + gh); 
        ctx.lineTo(gx, gy);      
        ctx.lineTo(gx + gw, gy); 
        ctx.closePath();
        ctx.fillStyle = "rgba(127, 140, 141, 0.15)"; 
        ctx.fill();
        
        // Label for Impossible Zone
        ctx.save();
        ctx.translate(gx + gw/4, gy + gh/2.2); 
        let angle = Math.atan2(-gh, gw);
        ctx.rotate(angle); 
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(127, 140, 141, 0.8)"; 
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("Impossible Region", 0, 0);
        ctx.font = "italic 12px sans-serif";
        ctx.fillText("(static)", 0, 15); 
        ctx.restore();

        // Axes
        ctx.strokeStyle = "#ccc"; ctx.lineWidth=1; ctx.strokeRect(gx, gy, gw, gh);
        
        ctx.fillStyle = "#2c3e50"; ctx.font = "bold 14px Sans-Serif"; ctx.textAlign = "center";
        ctx.fillText("Friction Force vs. Applied Force", 350, 275);
        
        ctx.font = "italic 13px Serif";
        ctx.fillText("Applied Force (0 - 100N)", 350, 550);
        ctx.save(); ctx.translate(20, 400); ctx.rotate(-Math.PI/2); ctx.fillText("Friction (0 - 100N)", 0, 0); ctx.restore();

        // 1. Kinetic Level Line
        let maxFric = state.maxFriction; 
        let fkY = (gy + gh) - (fk / maxFric) * gh;
        ctx.strokeStyle = "#27ae60"; ctx.setLineDash([5,5]); ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(gx, fkY); ctx.lineTo(gx+gw, fkY); ctx.stroke();
        ctx.fillStyle = "#27ae60"; ctx.textAlign="right"; ctx.font="12px sans-serif";
        ctx.fillText("Kinetic Level (" + fk.toFixed(1) + "N)", gx + gw - 5, fkY - 5);

        // 2. Static Max Line
        let fsY = (gy + gh) - (fs_max / maxFric) * gh;
        ctx.strokeStyle = "#95a5a6"; ctx.setLineDash([5,5]); ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(gx, fsY); ctx.lineTo(gx+gw, fsY); ctx.stroke();
        ctx.fillStyle = "#7f8c8d"; ctx.textAlign="right";
        ctx.fillText("Max Static (" + fs_max.toFixed(1) + "N)", gx + gw - 5, fsY - 5);
        ctx.setLineDash([]);

        // 3. Plot Data
        ctx.beginPath();
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth=3;
        let maxFa = 100; 
        state.graphData.forEach((p, i) => {
            let plotX = gx + (p.x / maxFa) * gw;
            let plotY = (gy + gh) - (p.y / maxFric) * gh;
            if(i===0) ctx.moveTo(plotX, plotY); else ctx.lineTo(plotX, plotY);
        });
        ctx.stroke();
        
        if(state.graphData.length > 0) {
            let last = state.graphData[state.graphData.length-1];
            let dotX = gx + (last.x / maxFa) * gw;
            let dotY = (gy + gh) - (last.y / maxFric) * gh;
            ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI*2); ctx.fill();
        }
    }

    // ===============================================
// === UNIT 5.1: MOMENTUM & IMPULSE (1D COLLISIONS) ===
// ===============================================
function setup_5_1() {
    canvas.height = 450; // Standard height
    document.getElementById('sim-title').innerText = "5.1 Momentum & Impulse";
    document.getElementById('sim-desc').innerHTML = `
        <p><b>Momentum (p = mv):</b> The quantity of motion. Total momentum is conserved in all collisions.
        <br><b>Elasticity:</b> 100% = Perfectly Elastic (Bounce), 0% = Perfectly Inelastic (Stick).
        <br><i>Observe how the Momentum Bars (p) change during the collision!</i></p>`;

    document.getElementById('sim-controls').innerHTML = `
        <div class="control-group">
            <label style="color:blue;"><b>Blue Cart</b> Mass (kg): <span id="v-m1">2.0</span></label>
            <input type="range" min="1" max="10" step="0.5" value="2.0" oninput="state.m1=parseFloat(this.value); document.getElementById('v-m1').innerText=state.m1;">
            
            <label style="color:blue;">Blue Velocity (m/s): <span id="v-u1">3.0</span></label>
            <input type="range" min="-10" max="10" step="1" value="3.0" oninput="state.u1=parseFloat(this.value); document.getElementById('v-u1').innerText=state.u1; reset_5_1();">
        </div>

        <div class="control-group">
            <label style="color:red;"><b>Red Cart</b> Mass (kg): <span id="v-m2">2.0</span></label>
            <input type="range" min="1" max="10" step="0.5" value="2.0" oninput="state.m2=parseFloat(this.value); document.getElementById('v-m2').innerText=state.m2;">
            
            <label style="color:red;">Red Velocity (m/s): <span id="v-u2">-3.0</span></label>
            <input type="range" min="-10" max="10" step="1" value="-3.0" oninput="state.u2=parseFloat(this.value); document.getElementById('v-u2').innerText=state.u2; reset_5_1();">
        </div>

        <div class="control-group">
            <label>Elasticity (%): <span id="v-e">100</span>%</label>
            <input type="range" min="0" max="1" step="0.05" value="1.0" oninput="state.e=parseFloat(this.value); document.getElementById('v-e').innerText=(state.e*100).toFixed(0);">
        </div>

        <div style="margin-top:15px; display:flex; gap:10px;">
            <button class="btn btn-green" onclick="start_5_1()">Start</button>
            <button class="btn btn-red" onclick="reset_5_1()">Reset</button>
        </div>
        <div id="data-readout" style="margin-top:10px; font-family:monospace; background:#eee; padding:5px;"></div>
    `;
    
    // Initialize State
    reset_5_1();
}

function start_5_1() {
    state.running = true;
    loop_5_1();
}

function reset_5_1() {
    // Initial State
    state = {
        m1: parseFloat(document.getElementById('v-m1').innerText),
        m2: parseFloat(document.getElementById('v-m2').innerText),
        u1: parseFloat(document.getElementById('v-u1').innerText), // Initial v
        u2: parseFloat(document.getElementById('v-u2').innerText),
        e: parseFloat(document.getElementById('v-e').innerText)/100, // Elasticity
        
        x1: 150, // Start positions
        x2: 550,
        w: 60, // Cart width
        h: 40, // Cart height
        
        v1: null, // Current v
        v2: null,
        collided: false,
        running: false
    };
    state.v1 = state.u1;
    state.v2 = state.u2;
    
    // Draw initial frame
    loop_5_1(); 
}

function loop_5_1() {
    if(currentSim !== '5.1') return;
    
    // Physics Logic
    if(state.running) {
        // Update Position
        let dt = 0.1; // Time step
        state.x1 += state.v1 * dt * 5; // *5 for visual speed
        state.x2 += state.v2 * dt * 5;
        
        // Collision Detection
        if(!state.collided && (state.x2 - state.x1) <= state.w) {
            state.collided = true;
            
            // 1D Elastic/Inelastic Collision Equations
            let m1 = state.m1, m2 = state.m2;
            let u1 = state.v1, u2 = state.v2;
            let e = state.e;
            
            // v1' = (m1 - e*m2)u1 + (1+e)m2u2 / (m1+m2)
            let v1_final = ((m1 - e*m2)*u1 + (1+e)*m2*u2) / (m1+m2);
            let v2_final = ((m2 - e*m1)*u2 + (1+e)*m1*u1) / (m1+m2);
            
            state.v1 = v1_final;
            state.v2 = v2_final;
            
            // Fix position overlap visual
            let overlap = state.w - (state.x2 - state.x1);
            state.x1 -= overlap/2;
            state.x2 += overlap/2;
        }
    }
    
    // Drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Track
    ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0, 250, canvas.width, 10);
    
    // Cart 1 (Blue)
    drawCart(state.x1, 250 - state.h, state.w, state.h, "#2980b9", state.m1, state.v1);
    
    // Cart 2 (Red)
    drawCart(state.x2, 250 - state.h, state.w, state.h, "#c0392b", state.m2, state.v2);
    
    // Momentum Bars
    drawMomentumBars();
    
    // Data Readout
    let p1 = state.m1 * state.v1;
    let p2 = state.m2 * state.v2;
    document.getElementById('data-readout').innerHTML = 
        `P_total: ${(p1+p2).toFixed(1)} kg·m/s <br> v1: ${state.v1.toFixed(2)} | v2: ${state.v2.toFixed(2)}`;

    if(state.running) requestAnimationFrame(loop_5_1);
}

// Helper for Carts
function drawCart(x, y, w, h, color, m, v) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "white"; 
    ctx.font = "bold 12px Arial";
    ctx.fillText(m+"kg", x+w/4, y+h/2+4);
    
    // Wheel
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.arc(x+10, y+h+5, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+w-10, y+h+5, 5, 0, Math.PI*2); ctx.fill();
    
    // Velocity Vector
    if(Math.abs(v) > 0.1) {
        let vLen = v * 10;
        drawVector(x + w/2, y - 10, vLen, 0, color);
        ctx.fillStyle = "black";
        ctx.fillText(v.toFixed(1)+" m/s", x + w/2 - 15, y - 25);
    }
}

// Helper for Momentum Charts
function drawMomentumBars() {
    let p1 = state.m1 * state.v1;
    let p2 = state.m2 * state.v2;
    let pTotal = p1 + p2;
    
    let originX = 100;
    let originY = 100;
    let scale = 3; // Scale for bar height
    
    ctx.font = "12px Arial"; ctx.fillStyle = "black";
    ctx.fillText("Momentum Charts (kg·m/s)", originX, originY - 60);
    
    // P1 Bar
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(originX, originY, 40, -p1 * scale);
    ctx.fillText("P1", originX+10, originY + 20);
    
    // P2 Bar
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(originX + 60, originY, 40, -p2 * scale);
    ctx.fillText("P2", originX+70, originY + 20);
    
    // Total Bar
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(originX + 120, originY, 40, -pTotal * scale);
    ctx.fillText("Total", originX+125, originY + 20);
    
    // Base Line
    ctx.strokeStyle = "black"; ctx.beginPath();
    ctx.moveTo(originX - 20, originY); ctx.lineTo(originX + 180, originY);
    ctx.stroke();
}
