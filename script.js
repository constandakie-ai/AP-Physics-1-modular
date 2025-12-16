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
    // === UNIT 2.4: STATIC VS KINETIC FRICTION (FINAL v7) ===
    // ===============================================
    function setup_2_4() {
        document.getElementById('sim-title').innerText = "2.4 Static vs. Kinetic Friction";
        document.getElementById('sim-desc').innerHTML = `
            <h3>The Friction "Hump"</h3>
            <p><b>Static Friction</b> (<span class="var">f<sub>s</sub></span>) matches the Applied Force up to a limit.
            <br><b>Kinetic Friction</b> (<span class="var">f<sub>k</sub></span>) takes over during motion.
            <br><i><b>Challenge:</b> Slowly increase force. Can you predict the exact value where it slips?</i></p>`;

        document.getElementById('sim-controls').innerHTML = `
            <div class="control-group">
                <label>Block Mass (<i class="var">m</i>): <span id="v-m">5.0</span> kg</label>
                <input type="range" id="in-m" min="1.0" max="10.0" step="0.5" value="5.0" oninput="reset_2_4()">
            </div>
            <div class="control-group">
                <label>Static Coeff (<i class="var">&mu;<sub>s</sub></i>): <span id="v-mus">0.6</span></label>
                <input type="range" id="in-mus" min="0.1" max="1.0" step="0.05" value="0.6" oninput="reset_2_4()">
            </div>
            <div class="control-group">
                <label>Kinetic Coeff (<i class="var">&mu;<sub>k</sub></i>): <span id="v-muk">0.4</span></label>
                <input type="range" id="in-muk" min="0.1" max="1.0" step="0.05" value="0.4" oninput="reset_2_4()">
            </div>
            <div class="control-group">
                <label>Applied Force (<i class="var">F<sub>app</sub></i>): <span id="v-fa">0</span> N</label>
                <input type="range" id="in-fa" min="0" max="100" value="0" step="0.5" oninput="state.Fa=parseFloat(this.value);">
            </div>
            
            <div class="control-group" style="margin-top:10px;">
                <label>Simulation Speed:</label>
                <div style="display:flex; gap:15px; margin-top:5px;">
                    <label style="font-weight:normal;"><input type="radio" name="spd" value="1" checked onclick="state.timeScale=1"> Regular</label>
                    <label style="font-weight:normal;"><input type="radio" name="spd" value="0.1" onclick="state.timeScale=0.1"> Slow Motion</label>
                </div>
            </div>

            <div style="margin-top:15px; padding:10px; background:#fff; border:1px solid #ddd; border-radius:4px; font-family:'Times New Roman', serif;">
                <div id="eq-x" style="margin-bottom:8px; height:30px; display:flex; align-items:center;"></div>
                <div id="eq-y" style="height:30px; display:flex; align-items:center;"></div>
            </div>

            <div style="margin-top:10px; padding:10px; background:#f8f9fa; border-radius:4px; font-size: 0.9em;">
                <div>Status: <span id="out-stat" style="font-weight:bold; color:#c0392b;">Static</span></div>
                <div>Friction (<i class="var">f</i>): <span id="out-ff">0.0</span> N</div>
            </div>
            <button class="btn btn-red" onclick="reset_2_4()" style="margin-top:15px;">Reset Graph</button>
        `;
        reset_2_4();
    }

    function reset_2_4() {
        state = {
            Fa: 0, 
            m: parseFloat(document.getElementById('in-m').value), 
            mu_s: parseFloat(document.getElementById('in-mus').value), 
            mu_k: parseFloat(document.getElementById('in-muk').value),
            v: 0, x: 0,
            graphData: [],
            running: true,
            lastFa: -1,
            timeScale: document.querySelector('input[name="spd"]:checked').value,
            maxFriction: 100 
        };
        // Reset slider UI
        document.getElementById('in-fa').value = 0;
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
        
        if (Math.abs(state.v) < 0.001) {
            // STATIC
            if (state.Fa <= fs_max) {
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
            // KINETIC
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
            if (state.v < 0) state.v = 0;
        }

        document.getElementById('out-ff').innerText = friction.toFixed(1);
        
        // --- DYNAMIC EQUATION BUILDER ---
        // Helper to map value to font size (min 14px, max 26px)
        let getFs = (val, max) => {
            let s = 14 + (Math.abs(val) / max) * 12; 
            if(s > 28) s = 28;
            return s + "px";
        };

        // Added &nbsp; for spacing as requested
        let sizeFa = getFs(state.Fa, 100);
        let sizeFf = getFs(friction, 100);
        
        let htmlX = `&Sigma;F<sub>x</sub> =&nbsp;&nbsp; 
            <span style="font-size:${sizeFa}; font-weight:bold; color:black; transition:0.1s;">F<sub>app</sub></span> 
            &nbsp;&minus;&nbsp; 
            <span style="font-size:${sizeFf}; font-weight:bold; color:#c0392b; transition:0.1s;">f</span> 
            &nbsp;=&nbsp; ${Fnet.toFixed(1)} N`;
            
        document.getElementById('eq-x').innerHTML = htmlX;

        let sizeFy = getFs(state.m, 10); 
        let htmlY = `&Sigma;F<sub>y</sub> =&nbsp;&nbsp; 
            <span style="font-size:${sizeFy}; font-weight:bold; color:blue; transition:0.1s;">F<sub>N</sub></span> 
            &nbsp;&minus;&nbsp; 
            <span style="font-size:${sizeFy}; font-weight:bold; color:green; transition:0.1s;">F<sub>g</sub></span> 
            &nbsp;=&nbsp; 0`;
            
        document.getElementById('eq-y').innerHTML = htmlY;


        // Graphing
        if(state.Fa !== state.lastFa) {
             state.graphData.push({x: state.Fa, y: friction});
             state.lastFa = state.Fa;
        }
        
        draw_2_4(friction, Fn, status);
        animId = requestAnimationFrame(loop_2_4);
    }

    function draw_2_4(fVal, Fn, status) {
        ctx.clearRect(0,0,700,450);
        
        // --- VISUALS ---
        // MOVED FLOOR UP to y=140 to make room for Gravity Vector
        let floorY = 140; 
        
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(0,0,700,200); 
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0,floorY,700,60); // Thicker floor
        
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
        
        // 1. Gravity (mg)
        let vectorScale = 0.6; // Slightly larger now that we have room
        let fgLen = (state.m * 9.8) * vectorScale; 
        drawVector(cx, cy + size/2, 0, fgLen, "green"); 
        ctx.fillStyle="black"; ctx.fillText("Fg", cx+5, cy + size/2 + fgLen + 10);

        // 2. Normal (Fn)
        let fnLen = fgLen; 
        drawVector(cx, cy - size/2, 0, -fnLen, "blue");
        ctx.fillText("Fn", cx+5, cy - size/2 - fnLen - 5);

        // 3. Applied (Fa)
        if(state.Fa > 0) {
            let faLen = state.Fa * 1.5; 
            drawVector(cx + size/2, cy, faLen, 0, "black");
            ctx.fillText("Fapp", cx + size/2 + faLen + 20, cy+4);
        }

        // 4. Friction (f)
        if(fVal > 0) {
            let fLen = fVal * 1.5;
            drawVector(cx - size/2, cy, -fLen, 0, "red");
            let labelChar = (status === 'static') ? "s" : "k";
            let labelX = cx - size/2 - fLen - 15;
            let labelY = cy+4;
            ctx.font = "italic 14px serif";
            ctx.fillText("f", labelX, labelY);
            ctx.font = "10px serif";
            ctx.fillText(labelChar, labelX+6, labelY+5); 
        }

        // --- MICROSCOPIC VIEW ---
        let bubbleX = 550; let bubbleY = 70; let r = 45;
        ctx.strokeStyle = "#7f8c8d"; ctx.lineWidth=1; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(bubbleX, bubbleY + r); ctx.lineTo(drawX + size/2, floorY); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(bubbleX, bubbleY, r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#333"; ctx.lineWidth=3; ctx.stroke();
        
        ctx.save();
        ctx.beginPath(); ctx.rect(bubbleX-r, bubbleY-r, 2*r, 2*r); ctx.clip(); 
        
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
        let gy = 230; let gh = 200; let gx = 60; let gw = 600;
        ctx.fillStyle = "white"; ctx.fillRect(0, 200, 700, 250);
        ctx.strokeStyle = "#ccc"; ctx.lineWidth=1; ctx.strokeRect(gx, gy, gw, gh);
        
        ctx.fillStyle = "#2c3e50"; ctx.font = "bold 14px Sans-Serif"; ctx.textAlign = "center";
        ctx.fillText("Friction Force vs. Applied Force", 350, 220);
        
        ctx.font = "italic 13px Serif";
        ctx.fillText("Applied Force (0 - 100N)", 350, 445);
        ctx.save(); ctx.translate(20, 330); ctx.rotate(-Math.PI/2); ctx.fillText("Friction (0 - 100N)", 0, 0); ctx.restore();

        // Plot
        ctx.beginPath();
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth=3;
        let maxFa = 100; let maxFric = state.maxFriction; 
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
        
        // Limit Line
        let fs_max = state.mu_s * Fn;
        let limitY = (gy + gh) - (fs_max / maxFric) * gh;
        ctx.strokeStyle = "#95a5a6"; ctx.setLineDash([5,5]); ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(gx, limitY); ctx.lineTo(gx+gw, limitY); ctx.stroke();
        ctx.fillStyle = "#7f8c8d"; ctx.textAlign="right";
        ctx.fillText("Max Static (" + fs_max.toFixed(1) + "N)", gx + gw - 5, limitY - 5);
        ctx.setLineDash([]);
    }
