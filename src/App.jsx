import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

// Lightweight custom SVG radar renderer — avoids Chart.js issues (no radialLinear error)
function drawRadarSVG(values, labels, width = 420, height = 300) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const levels = 5;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.display = "block";

  // concentric polygons (grid)
  for (let lvl = levels; lvl >= 1; lvl--) {
    const r = (radius * lvl) / levels;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      pts.push(`${x},${y}`);
    }
    const poly = document.createElementNS(ns, "polygon");
    poly.setAttribute("points", pts.join(" "));
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "rgba(255,165,0,0.08)");
    svg.appendChild(poly);
  }

  // axes, labels and value dots
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", x);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "rgba(255,165,0,0.12)");
    svg.appendChild(line);

    // label
    const lx = cx + (radius + 18) * Math.cos(angle);
    const ly = cy + (radius + 18) * Math.sin(angle);
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", lx);
    t.setAttribute("y", ly);
    t.setAttribute("font-size", 12);
    t.setAttribute("fill", "#FFD27F");
    t.setAttribute("text-anchor", "middle");
    t.textContent = labels[i];
    svg.appendChild(t);

    // value dot
    const val = values[i] / 100;
    const vx = cx + radius * val * Math.cos(angle);
    const vy = cy + radius * val * Math.sin(angle);
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", vx);
    dot.setAttribute("cy", vy);
    dot.setAttribute("r", 4);
    dot.setAttribute("fill", "rgba(255,165,0,0.9)");
    svg.appendChild(dot);

    // numeric tick near vertical axes (keep number upright and readable)
    const deg = (angle * 180) / Math.PI;
    if (Math.abs(deg + 90) < 35 || Math.abs(Math.abs(deg) - 90) < 35) {
      const num = document.createElementNS(ns, "text");
      num.setAttribute("x", vx + 12);
      num.setAttribute("y", vy + 4);
      num.setAttribute("font-size", 10);
      num.setAttribute("fill", "#FFD27F");
      num.textContent = Math.round(values[i]);
      svg.appendChild(num);
    }
  }

  // polygon for values
  const pts2 = [];
  for (let i = 0; i < 6; i++) {
    const val = values[i] / 100;
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const x = cx + radius * val * Math.cos(angle);
    const y = cy + radius * val * Math.sin(angle);
    pts2.push(`${x},${y}`);
  }
  const shape = document.createElementNS(ns, "polygon");
  shape.setAttribute("points", pts2.join(" "));
  shape.setAttribute("fill", "rgba(255,165,0,0.12)");
  shape.setAttribute("stroke", "rgba(255,165,0,0.9)");
  svg.appendChild(shape);

  return svg;
}

export default function App() {
  // Text inputs left intentionally empty for preview
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [bio, setBio] = useState("");
  const [skill1, setSkill1] = useState("");
  const [skill2, setSkill2] = useState("");
  const [ultimate, setUltimate] = useState("");
  const [special, setSpecial] = useState("");

  // Keep radar visible in preview with mid values
  const [stats, setStats] = useState([60, 60, 60, 60, 60, 60]);
  const [footerText, setFooterText] = useState("");
  const [fontList, setFontList] = useState([]);
  const [selectedFont, setSelectedFont] = useState("system-ui, Arial, sans-serif");

  const radarRef = useRef(null);
  const previewWrapperRef = useRef(null); // Rename the flex container ref
  const previewRef = useRef(null); // Introduce a new ref for the inner, fixed-width div

  useEffect(() => {
    // Best-effort: enumerate document.fonts where available
    (async () => {
      try {
        await document.fonts.ready;
        const names = [];
        document.fonts.forEach((f) => {
          if (f.family) names.push(String(f.family).replace(/['\"]/g, ""));
        });
        if (names.length) setFontList(Array.from(new Set(names)).slice(0, 40));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!radarRef.current) return;
    radarRef.current.innerHTML = "";
    const labels = ["智力", "人脉", "体能", "技术力", "攻击", "防御"];
    const svg = drawRadarSVG(stats, labels, 380, 300);
    radarRef.current.appendChild(svg);
  }, [stats]);

  function handleAvatar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(f);
  }

  function updateStat(i, v) {
    const next = stats.slice();
    next[i] = Math.min(100, Math.max(0, Number(v) || 0));
    setStats(next);
  }

  async function exportImage() {
    // BUG FIX: Capture the inner div (previewRef.current) which has the fixed width (920px),
    // instead of the flex-item wrapper (previewWrapperRef.current) which might be wider.
    if (!previewRef.current) return;
    await new Promise((r) => setTimeout(r, 200));
    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${nickname || "power-profile"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "linear-gradient(135deg,#070617,#0b1220)", color: "#fff", fontFamily: selectedFont }}>
      <h2 style={{ textAlign: "center", color: "#FFB86B", marginBottom: 18 }}>战力档案生成器（预览）</h2>

      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        <div style={{ width: 360, background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,165,0,0.06)" }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>人物昵称</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>人物头像</label>
            <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: "block", marginTop: 6 }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>个人简介</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13 }}>喜欢</label>
              <input value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13 }}>厌恶</label>
              <input value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13 }}>技能（特殊技能会高亮为红色）</label>
            <input value={skill1} onChange={(e) => setSkill1(e.target.value)} placeholder="一技能" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700 }} />
            <input value={skill2} onChange={(e) => setSkill2(e.target.value)} placeholder="二技能" style={{ width: "100%", padding: 8, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700 }} />
            <input value={ultimate} onChange={(e) => setUltimate(e.target.value)} placeholder="大招" style={{ width: "100%", padding: 8, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700 }} />
            <input value={special} onChange={(e) => setSpecial(e.target.value)} placeholder="特殊技能" style={{ width: "100%", padding: 8, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff", fontWeight: 700 }} />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13 }}>字体选择（尽力枚举系统字体）</label>
            <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }}>
              <option value="system-ui, Arial, sans-serif">默认系统字体</option>
              {fontList.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13 }}>底部文案（可留空）</label>
            <input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }} />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, color: '#FFD27F' }}>战力数值（0-100）</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              {['智力','人脉','体能','技术力','攻击','防御'].map((label, idx) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: '#FFD27F' }}>{label}</div>
                  <input type="number" value={stats[idx]} onChange={(e) => updateStat(idx, e.target.value)} min={0} max={100} style={{ width: '100%', padding: 6, marginTop: 6, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#fff' }} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={exportImage} style={{ marginTop: 12, width: '100%', padding: 10, background: '#ff8f1c', color: '#081018', fontWeight: 700, borderRadius: 10 }}>生成图片并下载</button>
        </div>

        {/* Change: The 'previewWrapperRef' is now on the outer flex item, and 'previewRef' is on the inner fixed-width content */}
        <div ref={previewWrapperRef} style={{ flex: 1 }}>
          <div ref={previewRef} style={{ padding: 20, borderRadius: 16, background: 'linear-gradient(180deg,#070617,#0b1120)', color: '#fff', width: 920, fontFamily: selectedFont }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 180, height: 180, borderRadius: 16, overflow: 'hidden', background: '#0a0a0f', border: '2px solid rgba(255,165,0,0.08)', boxShadow: '0 10px 30px rgba(255,140,0,0.08)'}}>
                  {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#9aa7ff', padding: 12 }}>未上传头像</div>}
                </div>
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFB86B' }}>{nickname || '英雄名'}</div>
                  <div style={{ fontSize: 13, color: '#d0d7e8', marginTop: 6 }}>喜欢: {likes || '—'}</div>
                  <div style={{ fontSize: 13, color: '#d0d7e8' }}>厌恶: {dislikes || '—'}</div>
                </div>
              </div>

              <div ref={radarRef} style={{ width: 420, height: 300 }}></div>

              <div style={{ flex: 1 }}>
                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,165,0,0.04)', border: '1px solid rgba(255,165,0,0.06)'}}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#FFB86B', marginBottom: 8 }}>简介</div>
                  <div style={{ fontSize: 14, color: '#fff', whiteSpace: 'pre-wrap' }}>{bio || '暂无简介'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,165,0,0.06)'}}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFB86B', marginBottom: 8 }}>技能</div>
                <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {skill1 ? <div><strong>一技能：</strong>{skill1}</div> : null}
                  {skill2 ? <div><strong>二技能：</strong>{skill2}</div> : null}
                  {ultimate ? <div><strong>大招：</strong>{ultimate}</div> : null}
                  {special ? <div><strong style={{ color: '#FF4C4C' }}>特殊技能：</strong><span style={{ color: '#fff' }}>{special}</span></div> : null}
                  {!skill1 && !skill2 && !ultimate && !special ? <div style={{ color: '#b7c0d9' }}>暂无技能</div> : null}
                </div>
              </div>

              <div style={{ width: 240, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 12, color: '#c9d2ff', opacity: 0.9 }}>{footerText || '战力档案 • 自动生成'}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}