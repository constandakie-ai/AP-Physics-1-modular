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
    // === UNIT 2.4: FRICTION CHALLENGE (AP LEVEL v7) ===
    // ===============================================

    // --- AP-LEVEL QUIZ DATA ---
    // acceptedUnits: list of valid strings. val: numeric answer.
    const u24_questions = [
        {
            tier: 1,
            q: "A 10 kg block sits on a level surface. What is the Normal Force (<i>F<sub>N</sub></i>)? (Assume <i>g</i> = 9.8 m/s²)",
            val: 98,
            units: ["n", "newton", "newtons"],
            hint: "On a level surface, <i>F<sub>N</sub> = mg</i>. Don't forget the unit (N)!"
        },
        {
            tier: 2,
            q: "If mass = 5 kg and <i>&mu;<sub>s</sub></i> = 0.4 on a level surface, what is the MAX Static Friction force?",
            val: 19.6,
            units: ["n", "newton", "newtons"],
            hint: "<i>f<sub>s,max</sub> = &mu;<sub>s</sub>F<sub>N</sub></i>. (<i>F<sub>N</sub></i> = 5 kg * 9.8 m/s²)"
        },
        {
            tier: 3,
            q: "A 4 kg block moves on a level surface with <i>&mu;<sub>k</sub></i> = 0.3. What is the kinetic friction force?",
            val: 11.76,
            units: ["n", "newton", "newtons"],
            hint: "<i>f<sub>k</sub> = &mu;<sub>k</sub>F<sub>N</sub></i>."
        },
        {
            tier: 4,
            q: "A 2 kg block is pushed with 10 N. Kinetic friction is 4 N. What is the acceleration?",
            val: 3,
            units: ["m/s^2", "m/s2", "ms^-2", "m/s/s"],
            hint: "<i>F<sub>net</sub> = ma</i>. <i>F<sub>net</sub></i> = 10 N - 4 N. Solve for <i>a</i> (in m/s²)."
        }
    ];

    function setup_2_4() {
        document.getElementById('sim-title').innerText = "2.4 Static vs. Kinetic Friction (AP Lab)";
        
        canvas.height = 600; // Layout Fix
        document.getElementById('sim-controls').innerHTML = `<div id="controls-area"></div>`;
        
        let existingQuiz = document.getElementById('quiz-area');
        if (existingQuiz) existingQuiz.remove();
        
        let quizDiv = document.createElement('div');
        quizDiv.id = 'quiz-area';
        quizDiv.className = 'quiz-panel';
        document.querySelector('.canvas-area').after(quizDiv);
        
        state = {
            Fa: 0, m: 5.0, mu_s: 0.6, mu_k: 0.4,
            v: 0, x: 0,
            graphData: [],
            running: true,
            lastFa: -1,
            maxFriction: 100,
            timeScale: 1,
            level: 0
        };
        
        render_2_4_UI(); 
        render_2_4_Quiz(); 
        loop_2_4(); 
    }

    // --- DYNAMIC UI ---
    function render_2_4_UI() {
        let lvl = state.level;
        const isLocked = (req) => lvl < req ? 'locked-group' : '';
        const lockIcon = (req) => lvl < req ? '<span style="float:right;">🔒</span>' : '';

        // Helper to update slider labels immediately
        window.updateLabel = (id, val) => document.getElementById(id).innerText = parseFloat(val).toFixed(2);

        let html = `
            <div class="control-group">
                <label>Block Mass (<i class="var">m</i>): <span id="v-m">${state.m.toFixed(1)}</span> kg</label>
                <input type="range" id="in-m" min="1.0" max="10.0" step="0.5" value="${state.m}" oninput="state.m=parseFloat(this.value); updateLabel('v-m', this.value); reset_graph_2_4()">
            </div>

            <div class="control-group ${isLocked(1)}">
                <label>Applied Force ${lockIcon(1)}</label>
                <input type="range" id="in-fa" min="0" max="100" value="${state.Fa}" step="0.5" oninput="state.Fa=parseFloat(this.value);">
            </div>

            <div class="control-group ${isLocked(2)}">
                <label>Static Coeff (<i>&mu;<sub>s</sub></i>): <span id="v-mus">${state.mu_s.toFixed(2)}</span> ${lockIcon(2)}</label>
                <input type="range" id="in-mus" min="0.1" max="1.0" step="0.05" value="${state.mu_s}" oninput="state.mu_s=parseFloat(this.value); updateLabel('v-mus', this.value); reset_graph_2_4()">
            </div>
            <div class="control-group ${isLocked(2)}">
                <label>Kinetic Coeff (<i>&mu;<sub>k</sub></i>): <span id="v-muk">${state.mu_k.toFixed(2)}</span> ${lockIcon(2)}</label>
                <input type="range" id="in-muk" min="0.1" max="1.0" step="0.05" value="${state.mu_k}" oninput="state.mu_k=parseFloat(this.value); updateLabel('v-muk', this.value); reset_graph_2_4()">
            </div>

            <div class="control-group ${isLocked(3)}">
                <label>Speed Control ${lockIcon(3)}</label>
                <div style="display:flex; gap:15px; margin-top:5px;">
                    <label style="font-weight:normal;"><input type="radio" name="spd" value="1" checked onclick="state.timeScale=1"> Regular</label>
                    <label style="font-weight:normal;"><input type="radio" name="spd" value="0.1" onclick="state.timeScale=0.1"> Slow Motion</label>
                </div>
            </div>

            <div style="margin-top:10px; padding:10px; background:#f8f9fa; border-radius:4px; font-size: 0.9em;">
                <div>Status: <span id="out-stat" style="font-weight:bold;">Static</span></div>
                <div>Friction: <span id="out-ff">0.0</span> N</div>
            </div>
            <button class="btn btn-red" onclick="reset_graph_2_4()" style="margin-top:15px;">Reset Graph</button>
        `;
        document.getElementById('controls-area').innerHTML = html;
    }

    // --- STRICT UNIT CHECKING ---
    function render_2_4_Quiz() {
        let qDiv = document.getElementById('quiz-area');
        if (!qDiv) return;

        if (state.level >= u24_questions.length) {
            qDiv.innerHTML = `<h3 style="color:#27ae60; margin:0;">🎉 AP Mastery Achieved!</h3><p>You have unlocked full control.</p>`;
            return;
        }

        let currQ = u24_questions[state.level];
        qDiv.innerHTML = `
            <div class="quiz-question" style="font-weight:bold; margin-bottom:5px;">AP Challenge Level ${state.level + 1}: ${currQ.q}</div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="q-input" class="quiz-input" placeholder="Value (e.g. 98)" style="flex:1; padding:5px;">
                <input type="text" id="q-unit" class="quiz-input" placeholder="Unit (e.g. N)" style="width:80px; padding:5px;">
                <button class="quiz-btn" onclick="check_2_4()" style="padding:5px 15px;">Submit</button>
            </div>
            <div id="q-feedback" class="quiz-feedback" style="margin-top:5px;"></div>
        `;
    }

    function check_2_4() {
        let valInput = parseFloat(document.getElementById('q-input').value);
        let unitInput = document.getElementById('q-unit').value.toLowerCase().trim();
        let currQ = u24_questions[state.level];
        let feedback = document.getElementById('q-feedback');
        
        // 1. Check Value (within 2% tolerance for rounding)
        let tolerance = currQ.val * 0.02; 
        let valCorrect = Math.abs(valInput - currQ.val) <= tolerance;

        // 2. Check Unit
        let unitCorrect = currQ.units.includes(unitInput);

        if (valCorrect && unitCorrect) {
            feedback.innerHTML = "<span style='color:#27ae60'>✅ Correct! Unlocking...</span>";
            state.level++;
            setTimeout(() => {
                render_2_4_UI();
                render_2_4_Quiz();
            }, 1000);
        } else if (!valCorrect) {
            feedback.innerHTML = `<span style='color:#c0392b'>❌ value incorrect. Hint: ${currQ.hint}</span>`;
        } else {
            feedback.innerHTML = `<span style='color:#e67e22'>⚠️ Number is right, but check your units!</span>`;
        }
    }

    function reset_graph_2_4() {
        // Update state logic
        state.m = parseFloat(document.getElementById('in-m').value);
        if(document.getElementById('in-mus')) {
            state.mu_s = parseFloat(document.getElementById('in-mus').value);
            state.mu_k = parseFloat(document.getElementById('in-muk').value);
        }
        
        state.graphData = [];
        state.lastFa = -1;
        state.v = 0; state.x = 0;
        state.maxFriction = 100;
        
        // Ensure UI labels match state
        if(document.getElementById('v-m')) document.getElementById('v-m').innerText = state.m.toFixed(1);
        if(document.getElementById('v-mus')) document.getElementById('v-mus').innerText = state.mu_s.toFixed(2);
        if(document.getElementById('v-muk')) document.getElementById('v-muk').innerText = state.mu_k.toFixed(2);
    }

    function loop_2_4() {
        if(currentSim !== '2.4') {
            let q = document.getElementById('quiz-area');
            if(q) q.remove();
            return;
        }
        
        let Fn = state.m * 9.8;
        let fs_max = state.mu_s * Fn;
        let fk = state.mu_k * Fn;
        let friction = 0;
        let Fnet = 0;
        let status = "static";
        
        if (Math.abs(state.v) < 0.001) {
            if (state.Fa <= fs_max) {
                friction = state.Fa;
                state.v = 0;
                status = "static";
                if(document.getElementById('out-stat')) {
                    document.getElementById('out-stat').innerText = "Static (Stuck)";
                    document.getElementById('out-stat').style.color = "#c0392b";
                }
            } else {
                state.v = 0.01;
                friction = fk;
                status = "kinetic";
            }
        } else {
            friction = fk;
            status = "kinetic";
            Fnet = state.Fa - fk;
            if(document.getElementById('out-stat')) {
                document.getElementById('out-stat').innerText = "Kinetic (Sliding)";
                document.getElementById('out-stat').style.color = "#27ae60";
            }
            let a = Fnet / state.m;
            let dt = 0.1 * state.timeScale;
            state.v += a * dt;
            state.x += state.v * dt;
            if(state.v < 0) state.v = 0;
        }
        
        if(document.getElementById('out-ff')) document.getElementById('out-ff').innerText = friction.toFixed(1);
        
        if(state.Fa !== state.lastFa) {
            state.graphData.push({x: state.Fa, y: friction});
            state.lastFa = state.Fa;
        }
        
        draw_2_4(friction, Fn, status);
        animId = requestAnimationFrame(loop_2_4);
    }

    function draw_2_4(fVal, Fn, status) {
        ctx.clearRect(0,0,700,600); 
        
        // --- TOP PANEL (SIMULATION) ---
        let floorY = 250;
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(0,0,700,270); // Sky
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0,floorY,700,20); // Floor
        
        let drawX = 150 + (state.x % 400); 
        let size = 30 + state.m * 4; 
        let by = floorY - size;
        
        // Block
        ctx.fillStyle = "#e67e22"; ctx.fillRect(drawX, by, size, size);
        ctx.strokeStyle = "#d35400"; ctx.lineWidth=2; ctx.strokeRect(drawX, by, size, size);
        ctx.fillStyle = "white"; ctx.font = "bold 12px serif"; ctx.textAlign="center";
        ctx.fillText(state.m.toFixed(1)+"kg", drawX + size/2, by + size/2 + 4);

        // VECTORS
        let cx = drawX + size/2; 
        let cy = by + size/2;
        
        // Gravity
        let fgLen = (state.m * 9.8) * 0.8; 
        drawVector(cx, cy + size/2, 0, fgLen, "green"); 
        ctx.fillStyle="black"; ctx.fillText("Fg", cx+5, cy + size/2 + fgLen + 10);
        
        // Normal
        let fnLen = fgLen; 
        drawVector(cx, cy - size/2, 0, -fnLen, "blue");
        ctx.fillText("Fn", cx+5, cy - size/2 - fnLen - 5);
        
        // Applied
        if(state.Fa > 0) {
            let faLen = state.Fa * 2.0;
            drawVector(cx + size/2, cy, faLen, 0, "black");
            ctx.fillText("Fapp", cx + size/2 + faLen + 20, cy+4);
        }
        
        // Friction
        if(fVal > 0) {
            let fLen = fVal * 2.0;
            drawVector(cx - size/2, cy, -fLen, 0, "red");
            let labelChar = (status === 'static') ? "s" : "k";
            let labelX = cx - size/2 - fLen - 15;
            let labelY = cy+4;
            ctx.font = "italic 14px serif";
            ctx.fillText("f", labelX, labelY);
            ctx.font = "10px serif";
            ctx.fillText(labelChar, labelX+6, labelY+5); 
        }

        // MICROSCOPIC VIEW
        let bubbleX = 550; let bubbleY = 80; let r = 50;
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

        // --- BOTTOM PANEL: GRAPH ---
        let gy = 300; let gh = 250; let gx = 60; let gw = 600;
        
        ctx.fillStyle = "white"; ctx.fillRect(0, 270, 700, 330);
        ctx.strokeStyle = "#ccc"; ctx.lineWidth=1; ctx.strokeRect(gx, gy, gw, gh);
        
        ctx.fillStyle = "#2c3e50"; ctx.font = "bold 14px Sans-Serif"; ctx.textAlign = "center";
        ctx.fillText("Friction Force vs. Applied Force", 350, 290);
        
        ctx.font = "italic 13px Serif";
        ctx.fillText("Applied Force (0 - 100N)", 350, 580);
        ctx.save(); ctx.translate(20, 450); ctx.rotate(-Math.PI/2); ctx.fillText("Friction (0 - 100N)", 0, 0); ctx.restore();
        
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
