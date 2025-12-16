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
    }
}

// ===============================================
// === PASTE YOUR SIMULATIONS BELOW THIS LINE ===
// ===============================================

// ===============================================
    // === UNIT 2.4: STATIC VS KINETIC FRICTION (FINAL v24 - MODES & LOCKS) ===
    // ===============================================
    function setup_2_4() {
        // Resize canvas to fit vertical vectors and graph (Protected setting)
        canvas.height = 600; 

        document.getElementById('sim-title').innerText = "2.4 Static vs. Kinetic Friction";
        document.getElementById('sim-desc').innerHTML = `
            <h3>The Friction "Hump"</h3>
            <p><b>Static Friction</b> (<span class="var">f<sub>s</sub></span>) matches Applied Force. Increasing Mass/&mu;<sub>s</sub> raises the <i>maximum limit</i>.
            <br><b>Kinetic Friction</b> (<span class="var">f<sub>k</sub></span>) is constant (<span class="var">&mu;<sub>k</sub>F<sub>n</sub></span>).
            <br><i><b>Note:</b> The <span style="color:#7f8c8d; font-weight:bold;">Grey Zone</span> on the graph is impossible because friction cannot exceed the applied force while stationary.</i></p>`;

        document.getElementById('sim-controls').innerHTML = `
            <div style="background:#eef2f3; padding:10px; border-radius:5px; margin-bottom:15px; border:1px solid #ccc;">
                <label style="font-weight:bold; margin-right:15px;">Mode:</label>
                <label style="margin-right:15px; cursor:pointer;">
                    <input type="radio" name="sim-mode" value="guided" checked onchange="setMode_2_4('guided')"> Guided Lab
                </label>
                <label style="cursor:pointer;">
                    <input type="radio" name="sim-mode" value="challenge" onchange="setMode_2_4('challenge')"> Challenge (Unlocked)
                </label>
            </div>

            <div class="control-group">
                <label>Block Mass (<i class="var">m</i>): <span id="v-m">5.0</span> kg</label>
                <input type="range" id="in-m" class="phys-slider" min="1.0" max="10.0" step="0.5" value="5.0" 
                    oninput="state.m=parseFloat(this.value); document.getElementById('v-m').innerText=state.m.toFixed(1);">
            </div>
            <div class="control-group">
                <label>Static Coeff (<i class="var">&mu;<sub>s</sub></i>): <span id="v-mus">0.6</span></label>
                <input type="range" id="in-mus" class="phys-slider" min="0.1" max="1.0" step="0.05" value="0.6" 
                    oninput="state.mu_s=parseFloat(this.value); document.getElementById('v-mus').innerText=state.mu_s.toFixed(2);">
            </div>
            <div class="control-group">
                <label>Kinetic Coeff (<i class="var">&mu;<sub>k</sub></i>): <span id="v-muk">0.4</span></label>
                <input type="range" id="in-muk" class="phys-slider" min="0.1" max="1.0" step="0.05" value="0.4" 
                    oninput="state.mu_k=parseFloat(this.value); document.getElementById('v-muk').innerText=state.mu_k.toFixed(2);">
            </div>
            <div class="control-group">
                <label>Applied Force (<i class="var">F<sub>app</sub></i>): <span id="v-fa">0</span> N</label>
                <input type="range" id="in-fa" min="0" max="100" value="0" step="0.5" 
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
            
            <div id="questions-section" style="margin-top:20px; border-top:2px solid #eee; padding-top:15px;">
                <h4 style="margin:0 0 10px 0;">Guided Questions</h4>
                <div style="font-size:0.9rem; color:#444;">
                    <p>1. Set Mass to 5kg and &mu;<sub>s</sub> to 0.5. Calculate the max static friction (f<sub>s,max</sub> = &mu;<sub>s</sub>F<sub>n</sub>). What force is needed to start moving?</p>
                    <p>2. Once moving, does increasing the Applied Force change the friction value? Why or why not?</p>
                    <p>3. <b>Predict:</b> If you increase mass while sliding, what happens to the friction vector?</p>
                </div>
            </div>
        `;
        reset_2_4();
    }

    function setMode_2_4(mode) {
        state.mode = mode;
        const qDiv = document.getElementById('questions-section');
        if(mode === 'challenge') {
            qDiv.style.display = 'none';
        } else {
            qDiv.style.display = 'block';
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
            mode: document.querySelector('input[name="sim-mode"]:checked').value
        };
        // Initial visibility check
        setMode_2_4(state.mode);
        
        document.getElementById('v-m').innerText = state.m.toFixed(1);
        document.getElementById('v-mus').innerText = state.mu_s.toFixed(2);
        document.getElementById('v-muk').innerText = state.mu_k.toFixed(2);
        
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
        
        // --- SLIDER LOCKING LOGIC ---
        // If Guided Mode AND moving, lock physics properties.
        // If Challenge Mode, always unlocked.
        let sliders = document.querySelectorAll('.phys-slider');
        let shouldLock = (state.mode === 'guided' && Math.abs(state.v) > 0.001);
        
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

        // --- MICROSCOPIC VIEW (LEFT/RAISED) ---
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
        
        // Label for Impossible Zone (ROTATED)
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
