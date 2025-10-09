import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

/*
  Zhanli Generator V2 - 完整文件（已修复 JSX 未闭合问题）

  主要说明：
  - 修复了之前因为 JSX 未闭合导致的 SyntaxError（Unterminated JSX contents）。
  - 雷达图使用 React JSX 的 <svg> 渲染（不再使用 document.createElementNS）。
  - 技能输入改为多行 <textarea>，预览中保留换行（white-space: pre-line）。
  - 导出图片时根据 devicePixelRatio 设置 html2canvas 的 scale，修复导出尺寸问题。

  使用：直接替换到 src/App.jsx 并在你的 React (Vite/CRA) 项目中运行。
*/

// 将极坐标角度转换为笛卡尔坐标
function polarToCartesian(cx, cy, radius, angleRad) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

// RadarSVG - 用 React JSX 渲染雷达图
function RadarSVG({ values = [60, 60, 60, 60, 60, 60], labels = ["智力", "人脉", "体能", "技术力", "攻击", "防御"], width = 420, height = 320 }) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 50;
  const levels = 5;

  // 背景网格
  const gridPolys = [];
  for (let lvl = levels; lvl >= 1; lvl--) {
    const r = (radius * lvl) / levels;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const p = polarToCartesian(cx, cy, r, angle);
      pts.push(`${p.x},${p.y}`);
    }
    gridPolys.push(pts.join(" "));
  }

  // 轴线、标签、点、数值
  const axes = [];
  const labelElements = [];
  const dotElements = [];
  const valueTexts = [];

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const outer = polarToCartesian(cx, cy, radius, angle);
    const lx = polarToCartesian(cx, cy, radius + 28, angle);

    axes.push({ x1: cx, y1: cy, x2: outer.x, y2: outer.y });
    labelElements.push({ x: lx.x, y: lx.y, text: labels[i] });

    const val = (values[i] || 0) / 100;
    const p = polarToCartesian(cx, cy, radius * val, angle);
    dotElements.push({ x: p.x, y: p.y });

    const offsetX = p.x >= cx ? 14 : -14;
    const anchor = p.x >= cx ? "start" : "end";
    valueTexts.push({ x: p.x + offsetX, y: p.y, text: String(Math.round(values[i] || 0)), anchor });
  }

  const polygonPoints = dotElements.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
      {/* 背景网格 */}
      {gridPolys.map((pts, idx) => (
        <polygon key={`g-${idx}`} points={pts} fill="none" stroke="rgba(255,165,0,0.06)" strokeWidth={1} />
      ))}

      {/* 轴线 */}
      {axes.map((a, i) => (
        <line key={`axis-${i}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="rgba(255,165,0,0.12)" strokeWidth={1} />
      ))}

      {/* 标签 */}
      {labelElements.map((lab, i) => (
        <text key={`lab-${i}`} x={lab.x} y={lab.y} fontSize={16} fill="#FFD27F" textAnchor="middle" dominantBaseline="middle">
          {lab.text}
        </text>
      ))}

      {/* 填充多边形 */}
      <polygon points={polygonPoints} fill="rgba(255,165,0,0.14)" stroke="rgba(255,165,0,0.95)" strokeWidth={2} />

      {/* 点与数值 */}
      {dotElements.map((d, i) => (
        <g key={`dot-${i}`}>
          <circle cx={d.x} cy={d.y} r={5} fill="rgba(255,165,0,0.95)" />
        </g>
      ))}

      {valueTexts.map((vt, i) => (
        <text key={`val-${i}`} x={vt.x} y={vt.y} fontSize={12} fill="#FFD27F" textAnchor={vt.anchor} dominantBaseline="middle">
          {vt.text}
        </text>
      ))}
    </svg>
  );
}

// 导出图片：根据 devicePixelRatio 设置 scale，减少用户手动缩放导致的导出尺寸问题
export async function exportImageWithScaleFix(previewElement, filename = "power-profile") {
  if (!previewElement) return null;
  const el = previewElement?.current ?? previewElement;
  if (!el) return null;

  // 等待短暂时间确保图片/字体加载完成
  await new Promise((r) => setTimeout(r, 200));
  const rect = el.getBoundingClientRect();
  const devicePixelRatio = window.devicePixelRatio || 1;
  const scale = devicePixelRatio;

  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: null,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return dataUrl;
}

// ------------------------------
// 主组件
// ------------------------------
export default function App() {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [bio, setBio] = useState("");
  const [skill1, setSkill1] = useState("");
  const [skill2, setSkill2] = useState("");
  const [ultimate, setUltimate] = useState("");
  const [special, setSpecial] = useState("");
  const [stats, setStats] = useState([60, 60, 60, 60, 60, 60]);
  const [footerText, setFooterText] = useState("");
  const [fontName, setFontName] = useState("");

  const previewRef = useRef(null);

  function handleAvatarUpload(e) {
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

  async function handleExport() {
    await exportImageWithScaleFix(previewRef, nickname || "power-profile");
  }

  const previewFont = fontName?.trim() ? fontName : "system-ui, Arial, sans-serif";

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "linear-gradient(135deg,#070617,#0b1220)", color: "#fff", fontFamily: previewFont }}>
      <h2 style={{ textAlign: "center", color: "#FFB86B", marginBottom: 18 }}>战力档案生成器（请把浏览器缩放调整至175%以确保能够正常渲染）</h2>

      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        {/* 左侧输入面板 */}
        <div style={{ width: 360, background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,165,0,0.06)" }}>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, display: "block" }}>人物昵称</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="在此处输入英雄名字" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, display: "block" }}>人物头像</label>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ marginTop: 6 }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, display: "block" }}>技能（可留空）</label>
            <textarea value={skill1} onChange={(e) => setSkill1(e.target.value)} placeholder="一技能（标题 + 描述）" rows={2} style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontWeight: 700 }} />
            <textarea value={skill2} onChange={(e) => setSkill2(e.target.value)} placeholder="二技能（标题 + 描述）" rows={2} style={{ width: "100%", padding: 8, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontWeight: 700 }} />
            <textarea value={ultimate} onChange={(e) => setUltimate(e.target.value)} placeholder="大招（标题 + 描述）" rows={2} style={{ width: "100%", padding: 8, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontWeight: 700 }} />
            <textarea value={special} onChange={(e) => setSpecial(e.target.value)} placeholder="特殊技能（留空则不显示）" rows={2} style={{ width: "100%", padding: 8, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontWeight: 700 }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, display: "block" }}>个人简介（位于技能下方）</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder=" 简单介绍一下ta吧..." style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, display: "block" }}>喜欢</label>
              <input value={likes} onChange={(e) => setLikes(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, display: "block" }}>厌恶</label>
              <input value={dislikes} onChange={(e) => setDislikes(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, display: "block" }}>字体名称（输入本机字体名）</label>
            <input value={fontName} onChange={(e) => setFontName(e.target.value)} placeholder="例如：Microsoft Yahei 或 Noto Sans SC" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, display: "block" }}>底部文案（可留空）</label>
            <input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="战力档案 • 自动生成" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, color: "#FFD27F", display: "block" }}>战力数值（0-100）</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              {["智力", "人脉", "体能", "技术力", "攻击", "防御"].map((label, idx) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: "#FFD27F" }}>{label}</div>
                  <input type={"number"} value={stats[idx]} onChange={(e) => updateStat(idx, e.target.value)} min={0} max={100} style={{ width: "100%", padding: 6, marginTop: 6, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleExport} style={{ marginTop: 12, width: "100%", padding: 10, background: "#ff8f1c", color: "#081018", fontWeight: 700, borderRadius: 10 }}>生成图片并下载</button>
        </div>

        {/* 右侧预览区 */}
        <div ref={previewRef} style={{ flex: 1, padding: 20, borderRadius: 16, background: "linear-gradient(180deg,#070617,#0b1120)", color: "#fff", width: 940, fontFamily: previewFont }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 220, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 180, height: 180, borderRadius: 16, overflow: "hidden", background: "#0a0a0f", border: "2px solid rgba(255,165,0,0.08)", boxShadow: "0 10px 30px rgba(255,140,0,0.08)" }}>
                {avatar ? (
                  <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ color: "#9aa7ff", padding: 12 }}>未上传头像</div>
                )}
              </div>

              <div style={{ marginTop: 12, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#FFB86B" }}>{nickname || "英雄名"}</div>
                <div style={{ fontSize: 14, color: "#d0d7e8", marginTop: 6 }}>喜欢: {likes || "—"}</div>
                <div style={{ fontSize: 14, color: "#d0d7e8" }}>厌恶: {dislikes || "—"}</div>
              </div>

            </div>

            <div style={{ width: 420, height: 320 }}>
              <RadarSVG values={stats} labels={["智力", "人脉", "体能", "技术力", "攻击", "防御"]} width={420} height={320} />
            </div>
          </div>

          {/* 技能块（技能名加粗） */}
          <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
            <div style={{ flex: 1, padding: 14, borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,165,0,0.06)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFB86B", marginBottom: 8 }}>技能</div>
              <div style={{ fontSize: 17, color: "#fff", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {skill1 ? <div><strong>一技能：</strong> <span style={{ fontWeight: 700 }}>{skill1}</span></div> : null}
                {skill2 ? <div style={{ marginTop: 6 }}><strong>二技能：</strong> <span style={{ fontWeight: 700 }}>{skill2}</span></div> : null}
                {ultimate ? <div style={{ marginTop: 6 }}><strong>大招：</strong> <span style={{ fontWeight: 700 }}>{ultimate}</span></div> : null}
                {special ? <div style={{ marginTop: 6 }}><strong style={{ color: "#FF4C4C" }}>特殊技能：</strong> <span style={{ fontWeight: 700 }}>{special}</span></div> : null}
                {!skill1 && !skill2 && !ultimate && !special ? <div style={{ color: "#b7c0d9" }}>暂无技能</div> : null}
              </div>
            </div>
          </div>

          {/* 简介块（位于技能下方） */}
          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.06)" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#FFB86B", marginBottom: 8 }}>简介</div>
            <div style={{ fontSize: 16, color: "#fff", whiteSpace: "pre-wrap" }}>{bio || "暂无简介"}</div>
          </div>

          <div style={{ marginTop: 18, textAlign: "right", fontSize: 13, color: "#c9d2ff", opacity: 0.9 }}>{footerText || "战力档案 • 自动生成"}</div>
        </div>
      </div>
    </div>
  );
}
