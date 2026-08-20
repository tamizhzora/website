// ============================================================================
// TAMIZH ZORA - Complete Video Streaming Platform v3
// v2 features: Admin reset views/likes, edit/delete comments, add/delete/ban users,
// sub-categories, edit coin balance, toggle like/dislike (mutual exclusion)
// v3 NEW: Gift coins by username, paid downloads, referral rewards (signup bonus
// + 1 coin per referred purchase), daily check-in (+5 coins), active-time rewards
// (+5 coins at 30min/day, +1 coin per extra 10min) with a live progress bar,
// ratings/reviews, video series (multi-part packs with bundle unlock), scheduled
// publishing, dark/light theme toggle, mobile bottom nav, coin-cost filters,
// search autocomplete, soft-delete + restore (Trash), danger-zone confirm modal,
// sort by most purchased, logged-out gate (login/signup required to browse).
// ============================================================================

// STEP 3: read-only KV migration-audit tool. Not part of the application —
// see migration/KV_AUDIT.md and migration/kv-audit.js for details.
import { handleMigrationAudit } from "./migration/kv-audit.js";

const HEAD = `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg-deep:#0E1420;
    --bg-panel:#161D2E;
    --bg-panel-2:#1D2540;
    --gold:#E8A33D;
    --gold-dim:#B9812B;
    --text-warm:#F2EDE4;
    --text-dim:#8B93A7;
    --danger:#D97757;
    --danger-bg:#3A2530;
    --border:#2A3352;
  }
  body[data-theme="light"]{
    --bg-deep:#F6F3EC;
    --bg-panel:#FFFFFF;
    --bg-panel-2:#EFE9DB;
    --gold:#C4801F;
    --gold-dim:#A5691A;
    --text-warm:#241D12;
    --text-dim:#6B6558;
    --danger:#B8462F;
    --danger-bg:#F6DED6;
    --border:#E3DCC9;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    background:var(--bg-deep);
    color:var(--text-warm);
    font-family:'Inter',sans-serif;
    -webkit-font-smoothing:antialiased;
    transition:background .15s ease,color .15s ease;
    padding-bottom:0;
  }
  a{color:inherit;text-decoration:none;}
  @keyframes skeleton-pulse{0%{opacity:.6;}50%{opacity:1;}100%{opacity:.6;}}
  @keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  .skeleton{animation:skeleton-pulse 1.5s infinite;background:var(--bg-panel-2);}
  .spinner{width:40px;height:40px;border:4px solid rgba(232,163,61,.2);border-top-color:var(--gold);border-radius:50%;animation:spin 1s linear infinite;margin:20px auto;}
  .perf{height:8px;background-image:radial-gradient(circle, var(--bg-deep) 2px, transparent 2.2px);background-size:16px 8px;background-color:var(--gold-dim);opacity:.55;}
  .ad-banner{background:var(--bg-panel-2);border:1px solid var(--border);border-radius:8px;padding:20px;text-align:center;color:var(--text-dim);font-size:12px;margin:0 0 16px 0;}
  .ad-space{width:100%;aspect-ratio:728/90;background:var(--bg-panel);border:1px dashed var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--text-dim);}
  header{padding:22px 28px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .wordmark{font-family:'Anton',sans-serif;font-size:26px;letter-spacing:2px;color:var(--text-warm);text-transform:uppercase;}
  .wordmark span{color:var(--gold);}
  .search{flex:1;max-width:420px;min-width:180px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text-warm);font-size:14px;}
  .search::placeholder{color:var(--text-dim);}
  main{padding:8px 28px 90px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));gap:22px;margin-top:18px;}
  .card{display:block;animation:fadeIn .3s ease;}
  .thumb-wrap{position:relative;border-radius:6px;overflow:hidden;border:1px solid var(--border);}
  .thumb-wrap::after{content:'\\25B6';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;background:rgba(14,20,32,0.72);border:1px solid var(--gold);color:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;padding-left:3px;opacity:0;transition:opacity .15s ease;}
  .card:hover .thumb-wrap::after{opacity:1;}
  .thumb{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:var(--bg-panel);}
  .card-title{margin-top:10px;font-size:14.5px;font-weight:600;line-height:1.35;color:var(--text-warm);}
  .card-meta{font-size:12px;color:var(--text-dim);margin-top:6px;display:flex;justify-content:space-between;align-items:center;}
  .card-rating{font-size:11.5px;color:var(--gold);margin-top:4px;display:flex;align-items:center;gap:5px;}
  .card-rating .stars{font-size:12px;}
  .card-rating-count{color:var(--text-dim);}
  .likes-dislikes{font-size:11px;color:var(--gold);display:flex;gap:8px;align-items:center;}
  .duration-badge{position:absolute;bottom:6px;right:6px;background:rgba(14,20,32,0.85);color:#F2EDE4;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;}
  .coin-cost-badge{position:absolute;top:6px;left:6px;background:rgba(14,20,32,0.9);color:var(--gold);font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid var(--gold-dim);}
  .claimed-badge{position:absolute;top:6px;right:6px;background:rgba(14,20,32,0.9);color:#7CD98A;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid #3E7A4A;}
  .series-badge{position:absolute;bottom:6px;left:6px;background:rgba(14,20,32,0.9);color:#8AB4F2;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid #3A5A8F;}
  .sort-tabs{display:flex;gap:10px;margin-bottom:6px;flex-wrap:wrap;}
  .sort-tab{background:var(--bg-panel);border:1px solid var(--border);color:var(--text-dim);padding:7px 14px;border-radius:16px;font-size:12.5px;font-weight:600;}
  .sort-tab.active{background:var(--gold);color:#1A1200;border-color:var(--gold);}
  .cat-menu-bar{width:100%;background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;gap:2px;overflow-x:auto;padding:0 28px;scrollbar-width:thin;}
  .cat-menu-item{padding:13px 16px;font-size:13px;font-weight:600;color:var(--text-dim);white-space:nowrap;border-bottom:2px solid transparent;cursor:pointer;}
  .cat-menu-item:hover{color:var(--text-warm);}
  .cat-menu-item.active{color:var(--gold);border-bottom-color:var(--gold);}
  .cat-submenu-bar{width:100%;background:var(--bg-deep);border-bottom:1px solid var(--border);display:flex;gap:4px;overflow-x:auto;padding:0 28px;}
  .cat-submenu-item{padding:9px 14px;font-size:12px;font-weight:600;color:var(--text-dim);white-space:nowrap;cursor:pointer;}
  .cat-submenu-item.active{color:var(--gold);}
  @media(max-width:700px){.cat-menu-bar,.cat-submenu-bar{padding:0 16px;}}
  .nav-link{font-size:13px;font-weight:600;color:var(--text-dim);white-space:nowrap;cursor:pointer;}
  .nav-link:hover{color:var(--gold);}
  .user-menu{font-size:13px;color:var(--text-dim);display:flex;align-items:center;gap:12px;white-space:nowrap;flex-wrap:wrap;}
  .user-profile{display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 12px;border:1px solid var(--border);border-radius:20px;background:var(--bg-panel);}
  .user-profile:hover{border-color:var(--gold-dim);}
  .coin-badge{font-size:11px;background:var(--gold);color:#1A1200;padding:2px 6px;border-radius:8px;font-weight:700;white-space:nowrap;}
  .bell-wrap{position:relative;cursor:pointer;font-size:16px;padding:6px;}
  .bell-dot{position:absolute;top:-4px;right:-6px;min-width:16px;height:16px;padding:0 3px;background:var(--danger);border-radius:9px;display:none;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;}
  .notif-panel{position:absolute;top:100%;right:0;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;width:300px;max-height:400px;overflow-y:auto;z-index:999;display:none;box-shadow:0 8px 24px rgba(0,0,0,.4);}
  .notif-panel.show{display:block;}
  .notif-panel-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);font-weight:700;font-size:13px;}
  .notif-markall{background:none;border:none;color:var(--gold);font-size:11px;cursor:pointer;padding:0;}
  .notif-item{display:flex;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);font-size:12.5px;color:var(--text-warm);line-height:1.4;text-decoration:none;}
  .notif-item.unread{background:var(--bg-panel-2);}
  .notif-item .notif-icon{font-size:15px;flex-shrink:0;}
  .notif-item .ntime{font-size:10.5px;color:var(--text-dim);margin-top:3px;}
  .notif-item-full{border-radius:8px;border:1px solid var(--border);}
  .notif-viewall{display:block;text-align:center;padding:9px;font-size:12px;color:var(--gold);text-decoration:none;}
  .notif-empty{padding:16px;color:var(--text-dim);font-size:12.5px;text-align:center;}
  .bn-badge{position:absolute;top:2px;margin-left:2px;min-width:14px;height:14px;padding:0 3px;background:var(--danger);border-radius:8px;font-size:9px;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;}
  .tag-green{color:#7CD98A;border-color:#7CD98A;}
  .theme-toggle{background:var(--bg-panel);border:1px solid var(--border);color:var(--text-warm);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}

  /* Watch page */
  .watch-wrap{max-width:960px;margin:0 auto;padding:20px 24px 90px;}
  .player-frame{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#000;margin-bottom:20px;}
  video{width:100%;display:block;background:#000;}
  .player-controls{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
  .act-btn{display:inline-flex;align-items:center;gap:6px;background:var(--bg-panel-2);border:1px solid var(--border);color:var(--text-warm);padding:8px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;}
  .act-btn:hover{border-color:var(--gold-dim);}
  .act-btn.liked{background:var(--gold);color:#1A1200;border-color:var(--gold);}
  .act-btn.disliked{background:#3A2530;color:#D97757;border-color:#D97757;}

  /* ── "Reel" player skin (NEW — Admin → 🎬 Player) — film-projector styled
     replacement for the plain <video controls> element. Reuses the site's
     own --gold/--bg-panel/--border tokens so it always matches whatever
     theme/branding is configured, in both dark and light mode. ────────── */
  .reel-deck{margin-bottom:14px;}
  .reel-projector-row{display:flex;align-items:center;justify-content:center;gap:16px;padding:2px 2px 10px;}
  .reel-spool{width:26px;height:26px;border-radius:50%;flex-shrink:0;position:relative;
    background:repeating-conic-gradient(var(--bg-panel-2) 0deg 8deg, #000 8deg 16deg);
    border:2px solid var(--border);}
  .reel-spool::after{content:'';position:absolute;inset:0;margin:auto;width:8px;height:8px;border-radius:50%;background:#000;border:2px solid var(--gold-dim);}
  .reel-spool.spin{animation:reel-spin 3s linear infinite;}
  .reel-spool.spin::after{border-color:var(--gold);}
  @keyframes reel-spin{to{transform:rotate(360deg);}}
  .reel-sprocket-strip{flex:1;height:8px;border-radius:2px;opacity:.7;
    background-image:repeating-linear-gradient(to right, var(--border) 0 4px, transparent 4px 14px);}
  .reel-screen-wrap{position:relative;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#000;aspect-ratio:16/9;}
  .reel-screen-wrap video{width:100%;height:100%;display:block;background:#000;object-fit:contain;}
  .reel-overlay-controls{position:absolute;left:0;right:0;bottom:0;padding:26px 12px 8px;
    background:linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,0));
    opacity:0;transition:opacity .2s ease;pointer-events:none;}
  .reel-screen-wrap.show-controls .reel-overlay-controls,
  .reel-screen-wrap.reel-paused .reel-overlay-controls{opacity:1;pointer-events:auto;}
  .reel-seek-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
  .reel-seek-row input[type="range"]{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.2);border-radius:2px;outline:none;}
  .reel-seek-row input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--gold);cursor:pointer;border:none;}
  .reel-seek-row input[type="range"]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--gold);border:none;cursor:pointer;}
  .reel-time{font-family:'Inter',monospace;font-size:11px;color:#D8D2C4;min-width:34px;}
  .reel-btn-row{display:flex;align-items:center;gap:8px;}
  .reel-icon-btn{background:none;border:none;color:#F2EDE4;cursor:pointer;display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;flex-shrink:0;}
  .reel-icon-btn:hover{color:var(--gold);}
  .reel-icon-btn svg{width:17px;height:17px;fill:currentColor;}
  .reel-icon-btn.reel-play svg{width:19px;height:19px;}
  .reel-vol-group{display:flex;align-items:center;gap:4px;width:80px;}
  .reel-vol-group input[type="range"]{width:100%;height:3px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.2);border-radius:2px;outline:none;}
  .reel-vol-group input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border-radius:50%;background:var(--gold);cursor:pointer;border:none;}
  .reel-spacer{flex:1;}
  .reel-speed-select{background:rgba(255,255,255,.1);color:#F2EDE4;border:1px solid rgba(255,255,255,.25);border-radius:5px;font-size:11px;padding:3px 5px;cursor:pointer;}
  .reel-ad-overlay{position:absolute;inset:0;background:#0a0a0a;display:none;flex-direction:column;align-items:center;justify-content:center;z-index:5;}
  .reel-ad-overlay.showing{display:flex;}
  .reel-ad-badge{position:absolute;top:10px;left:10px;background:var(--danger);color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:3px;}
  .reel-ad-timer{position:absolute;top:10px;right:10px;background:rgba(255,255,255,.12);color:#D8D2C4;font-size:11px;padding:3px 8px;border-radius:3px;}
  .reel-ad-slate{text-align:center;color:#B7AF9E;padding:0 20px;}
  .reel-ad-slate .headline{font-size:15px;color:#F2EDE4;font-weight:700;}
  .reel-ad-slate .sub{font-size:12px;margin-top:4px;}
  .reel-ad-progress{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.12);}
  .reel-ad-progress-fill{height:100%;width:0%;background:var(--gold);transition:width .2s linear;}
  .reel-skip-ad-btn{position:absolute;bottom:14px;right:12px;background:rgba(255,255,255,.14);color:#F2EDE4;border:1px solid rgba(255,255,255,.25);font-size:12px;padding:7px 14px;border-radius:5px;cursor:pointer;display:none;align-items:center;gap:6px;}
  .reel-skip-ad-btn.visible{display:flex;}
  .reel-skip-ad-btn:hover{background:rgba(255,255,255,.24);}
  .reel-skip-ad-btn svg{width:11px;height:11px;fill:currentColor;}
  .reel-shortcuts-hint{text-align:center;font-size:10.5px;color:var(--text-dim);padding:8px 6px 0;}
  .reel-shortcuts-hint kbd{background:var(--bg-panel-2);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-family:inherit;}
  .watch-title{font-family:'Anton',sans-serif;letter-spacing:.5px;font-size:22px;margin:18px 0 4px;}
  .action-row{display:flex;align-items:center;gap:12px;margin:16px 0 8px;flex-wrap:wrap;}
  .back-link{display:inline-block;margin-bottom:16px;color:var(--gold);font-size:13px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;}
  .comment{padding:14px 0;border-bottom:1px solid var(--border);}
  .comment .cname{font-weight:700;font-size:13.5px;color:var(--gold);}
  .comment .ctext{font-size:13.5px;margin-top:4px;line-height:1.5;color:var(--text-warm);}
  .comment .ctime{font-size:11px;color:var(--text-dim);margin-top:4px;}
  .stars{color:var(--gold);font-size:15px;letter-spacing:1px;}
  .star-input{cursor:pointer;font-size:22px;color:var(--border);}
  .star-input.filled{color:var(--gold);}
  .series-row{display:flex;gap:10px;overflow-x:auto;padding:4px 0 8px;}
  .series-item{flex:0 0 140px;position:relative;}
  .series-item img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;border:2px solid transparent;}
  .series-item.current img{border-color:var(--gold);}
  .series-item .plabel{font-size:11px;color:var(--text-dim);margin-top:4px;text-align:center;}

  /* Purchase gate */
  .purchase-gate{border:1px solid var(--border);border-radius:8px;background:var(--bg-panel);padding:40px 24px;text-align:center;margin-bottom:20px;}
  .purchase-gate .pg-icon{font-size:34px;margin-bottom:10px;}
  .purchase-gate h3{font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;font-size:20px;margin:0 0 8px;}
  .purchase-gate p{color:var(--text-dim);font-size:13.5px;margin:0 0 18px;}
  .purchase-btn{background:var(--gold);color:#1A1200;border:none;border-radius:8px;padding:13px 26px;font-weight:700;font-size:14px;cursor:pointer;}
  .purchase-btn:disabled{opacity:.5;cursor:not-allowed;}
  .purchase-btn.secondary{background:var(--bg-panel-2);color:var(--gold);border:1px solid var(--gold-dim);margin-left:8px;}

  /* Admin */
  .admin-wrap{max-width:1100px;margin:0 auto;padding:30px 24px 60px;}
  .admin-title{font-family:'Anton',sans-serif;font-size:24px;letter-spacing:1px;margin-bottom:4px;}
  .admin-sub{color:var(--text-dim);font-size:13.5px;margin-bottom:26px;}
  .admin-tabs{display:flex;gap:10px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:10px;flex-wrap:wrap;}
  .admin-tab{padding:10px 14px;cursor:pointer;border:none;background:transparent;color:var(--text-dim);font-weight:600;font-size:13px;}
  .admin-tab.active{color:var(--gold);border-bottom:2px solid var(--gold);}
  .users-table{width:100%;border-collapse:collapse;}
  .users-table th,.users-table td{padding:12px;text-align:left;border-bottom:1px solid var(--border);font-size:13px;}
  .users-table th{background:var(--bg-panel);font-weight:700;color:var(--text-dim);}
  .users-table tr:hover td{background:var(--bg-panel);}
  .mode-switch-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;background:var(--bg-panel-2);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:18px;}
  .live-viewers-badge{display:flex;align-items:center;gap:7px;background:var(--bg-panel-2);border:1px solid #3E7A4A;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:700;color:#7CD98A;white-space:nowrap;}
  .lvb-dot{width:8px;height:8px;border-radius:50%;background:#7CD98A;box-shadow:0 0 0 rgba(124,217,138,.6);animation:lvbPulse 2s infinite;}
  @keyframes lvbPulse{0%{box-shadow:0 0 0 0 rgba(124,217,138,.55);}70%{box-shadow:0 0 0 7px rgba(124,217,138,0);}100%{box-shadow:0 0 0 0 rgba(124,217,138,0);}}
  .mode-switch-label{font-size:13.5px;color:var(--text-warm);}
  .mode-toggle-btn{margin:0;padding:10px 18px;border-radius:22px;font-size:12.5px;font-weight:700;cursor:pointer;border:1px solid var(--gold-dim);background:var(--gold);color:#1A1200;white-space:nowrap;}
  .mode-toggle-btn.is-free{background:transparent;color:var(--gold);border:1px solid var(--gold-dim);}
  .dup-warning{background:var(--danger-bg);border:1px solid var(--danger);color:var(--danger);padding:12px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;}
  .ban-btn{background:var(--danger-bg);border:1px solid var(--danger);color:var(--danger);padding:5px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;margin:0;}
  .unban-btn{background:var(--bg-panel-2);border:1px solid var(--gold-dim);color:var(--gold);padding:5px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;margin:0;}
  .del-btn{background:transparent;border:1px solid var(--danger-bg);color:var(--danger);padding:5px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;margin:0;}
  label{display:block;font-size:13px;font-weight:600;color:var(--text-dim);margin:16px 0 6px;text-transform:uppercase;letter-spacing:.5px;}
  input[type=text],input[type=email],input[type=number],input[type=password],input[type=datetime-local],select,textarea{width:100%;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:12px 14px;color:var(--text-warm);font-size:14px;font-family:'Inter',sans-serif;margin-bottom:10px;}
  input[type=number]{-moz-appearance:textfield;}
  textarea{resize:vertical;min-height:80px;}
  button[type=submit]{margin-top:16px;background:var(--gold);color:#1A1200;border:none;border-radius:8px;padding:13px 22px;font-weight:700;font-size:14px;letter-spacing:.3px;cursor:pointer;}
  button[type=submit]:hover{background:#F0AE52;}

  /* Auth */
  .auth-wrap{max-width:400px;margin:60px auto;padding:0 24px;}
  .msg{margin-top:18px;padding:12px 14px;border-radius:8px;font-size:13.5px;background:var(--bg-panel-2);border:1px solid var(--gold-dim);}
  .msg.err{border-color:var(--danger);background:var(--danger-bg);}
  .empty{margin-top:60px;text-align:center;color:var(--text-dim);}
  .gate-wrap{max-width:460px;margin:70px auto;padding:0 24px;text-align:center;}
  .gate-icon{font-size:40px;margin-bottom:14px;}
  .gate-wrap h2{font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;font-size:24px;margin:0 0 10px;}
  .gate-wrap p{color:var(--text-dim);font-size:14px;line-height:1.6;margin:0 0 24px;}
  .gate-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
  .activebar-wrap{width:100%;background:var(--bg-panel);border-bottom:1px solid var(--border);padding:6px 28px;display:flex;align-items:center;gap:10px;}
  .activebar-label{font-size:11px;color:var(--text-dim);white-space:nowrap;font-weight:600;}
  .activebar-track{flex:1;height:6px;background:var(--bg-panel-2);border-radius:4px;overflow:hidden;max-width:260px;}
  .activebar-fill{height:100%;width:0%;background:var(--gold);border-radius:4px;transition:width .4s ease;}
  .activebar-pct{font-size:11px;color:var(--gold);font-weight:700;white-space:nowrap;}
  @media(max-width:700px){.activebar-wrap{padding:6px 16px;}.activebar-label{display:none;}}
  .empty h2{font-family:'Anton',sans-serif;letter-spacing:1px;color:var(--text-warm);font-size:22px;font-weight:400;}
  .toast{position:fixed;bottom:78px;left:50%;transform:translateX(-50%);background:var(--bg-panel-2);border:1px solid var(--gold-dim);color:var(--text-warm);padding:10px 18px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .25s ease;pointer-events:none;z-index:9999;}
  .toast.show{opacity:1;}
  body.theatre .watch-wrap{max-width:1280px;}
  .row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);}
  .row img{width:80px;aspect-ratio:16/9;object-fit:cover;border-radius:4px;flex-shrink:0;}
  .row .rt{flex:1;font-size:13.5px;}
  .edit-btn{background:transparent;border:1px solid var(--border);color:var(--text-warm);padding:7px 12px;font-size:12px;margin:0;border-radius:6px;display:inline-block;cursor:pointer;}
  .searchform{flex:1;max-width:420px;min-width:180px;display:flex;position:relative;}
  .autocomplete-list{position:absolute;top:100%;left:0;right:0;background:var(--bg-panel);border:1px solid var(--border);border-top:none;border-radius:0 0 8px 8px;z-index:998;display:none;max-height:260px;overflow-y:auto;}
  .autocomplete-list.show{display:block;}
  .autocomplete-item{padding:9px 14px;font-size:13px;color:var(--text-warm);cursor:pointer;}
  .autocomplete-item:hover{background:var(--bg-panel-2);}
  .inline-form{display:inline;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  @media(max-width:600px){.grid-2{grid-template-columns:1fr;}}
  .stat-card{background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:16px 20px;}
  .stat-card .num{font-family:'Anton',sans-serif;font-size:28px;color:var(--gold);}
  .stat-card .lbl{font-size:12px;color:var(--text-dim);margin-top:2px;}
  .section-head{font-size:13px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin:24px 0 12px;}
  .sub-cat-tree{background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:16px;}
  .sub-cat-row{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .sub-cat-row:last-child{border-bottom:none;}
  .sub-cat-label{font-size:13px;font-weight:600;color:var(--text-warm);}
  .sub-cat-parent{font-size:11px;color:var(--text-dim);margin-left:8px;}
  .tag{display:inline-block;background:var(--bg-panel-2);border:1px solid var(--border);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--text-dim);}
  .comment-admin{padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg-panel);margin-bottom:8px;}
  .comment-admin .cmeta{font-size:11px;color:var(--text-dim);margin-bottom:4px;}
  .comment-admin .ctext{font-size:13px;color:var(--text-warm);}
  .price-filters{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;}
  .price-filter{background:var(--bg-panel);border:1px solid var(--border);color:var(--text-dim);padding:6px 13px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer;}
  .price-filter.active{background:var(--bg-panel-2);color:var(--gold);border-color:var(--gold-dim);}

  /* Bottom nav (mobile) */
  .bottom-nav{display:none;}
  @media(max-width:700px){
    body{padding-bottom:64px;}
    .bottom-nav{
      display:flex;position:fixed;bottom:0;left:0;right:0;background:var(--bg-panel);
      border-top:1px solid var(--border);z-index:900;padding:6px 0 max(6px, env(safe-area-inset-bottom));
    }
    .bn-item{flex:1;text-align:center;font-size:10.5px;color:var(--text-dim);padding:6px 2px;position:relative;}
    .bn-item.active{color:var(--gold);}
    .bn-icon{font-size:19px;display:block;margin-bottom:2px;}
    header{padding:16px 16px 10px;}
    main{padding:8px 16px 90px;}
    .watch-wrap{padding:16px 16px 90px;}
  }

  /* Danger zone confirm modal */
  .dz-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:9998;padding:20px;}
  .dz-overlay.show{display:flex;}
  .dz-modal{background:var(--bg-panel);border:1px solid var(--danger);border-radius:10px;padding:22px;max-width:380px;width:100%;}
  .dz-modal h3{color:var(--danger);font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin:0 0 10px;font-size:18px;}
  .dz-modal p{font-size:13px;color:var(--text-dim);line-height:1.5;margin:0 0 14px;}
  .dz-modal input{margin-bottom:14px;}
  .dz-actions{display:flex;gap:8px;justify-content:flex-end;}
  .dz-cancel{background:transparent;border:1px solid var(--border);color:var(--text-warm);padding:9px 16px;border-radius:6px;font-size:13px;cursor:pointer;}
  .dz-confirm{background:var(--danger);border:none;color:#fff;padding:9px 16px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;}
  .dz-confirm:disabled{opacity:.4;cursor:not-allowed;}

  /* Background music control (NEW) */
  .music-toggle{position:fixed;left:16px;bottom:16px;z-index:850;width:46px;height:46px;border-radius:50%;background:var(--bg-panel);border:1px solid var(--gold-dim);color:var(--gold);font-size:19px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.25);}
  .music-toggle.muted{color:var(--text-dim);border-color:var(--border);}
  @media(max-width:700px){.music-toggle{left:10px;bottom:74px;width:42px;height:42px;font-size:17px;}}
  .music-title-toast{position:fixed;left:70px;bottom:22px;z-index:850;background:var(--bg-panel);border:1px solid var(--border);color:var(--text-dim);font-size:11.5px;padding:6px 10px;border-radius:6px;opacity:0;transition:opacity .3s ease;pointer-events:none;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .music-title-toast.show{opacity:1;}
  @media(max-width:700px){.music-title-toast{left:58px;bottom:80px;}}

  /* Admin: release-date pill + series collapsibles (NEW) */
  .release-pill{display:inline-block;background:var(--bg-panel-2);border:1px solid var(--border);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--text-dim);}
  .hidden-pill{color:var(--danger);border-color:var(--danger);}
  .visible-pill{color:#7CD98A;border-color:#3E7A4A;}
  .admin-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:16px;}
  .admin-filters input,.admin-filters select{margin:0;}
  details.series-block{background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:14px;}
  details.series-block summary{list-style:none;cursor:pointer;padding:14px 16px;background:var(--bg-panel-2);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
  details.series-block summary::-webkit-details-marker{display:none;}
  details.series-block summary::before{content:'▶';display:inline-block;margin-right:8px;font-size:11px;color:var(--gold);transition:transform .15s ease;}
  details.series-block[open] summary::before{transform:rotate(90deg);}
  .series-part-row{padding:10px 16px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .series-part-row img{width:64px;aspect-ratio:16/9;object-fit:cover;border-radius:4px;flex-shrink:0;}
  .wordmark-logo-mobile{display:none;}
  @media (max-width:640px){
    .wordmark-logo-desktop{display:none;}
    .wordmark-logo-mobile{display:inline-block;}
  }
  .site-announcement{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#0E1420;font-size:13px;font-weight:600;padding:9px 36px 9px 14px;position:relative;text-align:center;}
  .site-announcement a.announcement-link{color:#0E1420;text-decoration:underline;}
  .announcement-close{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:#0E1420;font-size:14px;cursor:pointer;opacity:.7;padding:4px;}
  .announcement-close:hover{opacity:1;}
  .site-footer{border-top:1px solid var(--border);margin-top:40px;padding:22px 16px;text-align:center;color:var(--text-dim);font-size:12.5px;}
  .footer-text{margin-bottom:10px;}
  .footer-social{display:flex;justify-content:center;gap:14px;margin-bottom:10px;font-size:18px;}
  .footer-social-link{color:var(--text-warm);text-decoration:none;opacity:.8;}
  .footer-social-link:hover{opacity:1;}
  .footer-copyright{color:var(--text-dim);}
</style>
`;

// Shared client script: theme (applied pre-paint to avoid flash), danger-zone modal,
// and helpers reused across every rendered page.
function themeBootScript(defaultTheme) {
  const fallback = defaultTheme === "light" || defaultTheme === "system" ? defaultTheme : "dark";
  return `<script>(function(){
    try {
      var saved = localStorage.getItem('theme');
      var t = saved;
      if (!t) {
        // No saved preference yet — use the admin-configured default, never
        // overwriting an existing user choice.
        t = ${JSON.stringify(fallback)};
        if (t === 'system') t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
      }
      document.body.setAttribute('data-theme', t);
    } catch(e) {}
  })();</script>`;
}

function dangerZoneScript() {
  return `
  <div class="dz-overlay" id="dzOverlay">
    <div class="dz-modal">
      <h3>⚠️ Danger zone</h3>
      <p id="dzMessage">This action is permanent and cannot be undone.</p>
      <input type="text" id="dzInput" placeholder="Type the confirmation text...">
      <div class="dz-actions">
        <button type="button" class="dz-cancel" onclick="dzCancel()">Cancel</button>
        <button type="button" class="dz-confirm" id="dzConfirmBtn" disabled onclick="dzConfirm()">Delete permanently</button>
      </div>
    </div>
  </div>
  <script>
    let dzPendingForm = null;
    function dangerConfirm(form, label) {
      dzPendingForm = form;
      document.getElementById('dzMessage').textContent = 'Type "' + label + '" to permanently delete this. This cannot be undone.';
      const input = document.getElementById('dzInput');
      input.value = '';
      input.dataset.expect = label;
      document.getElementById('dzConfirmBtn').disabled = true;
      document.getElementById('dzOverlay').classList.add('show');
      input.oninput = function(){ document.getElementById('dzConfirmBtn').disabled = (input.value !== input.dataset.expect); };
      input.focus();
      return false; // block default submit; dzConfirm() will submit programmatically
    }
    function dzCancel(){ document.getElementById('dzOverlay').classList.remove('show'); dzPendingForm = null; }
    function dzConfirm(){
      if (dzPendingForm) { document.getElementById('dzOverlay').classList.remove('show'); dzPendingForm.submit(); }
    }
  </script>`;
}

function themeToggleBtn() {
  return `<button type="button" class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">🌓</button>
  <script>
    function toggleTheme(){
      const cur = document.body.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      try{ localStorage.setItem('theme', next); }catch(e){}
    }
  </script>`;
}

function bottomNav(session, active) {
  const item = (href, icon, label, key) => `<a class="bn-item ${active === key ? "active" : ""}" href="${href}"><span class="bn-icon">${icon}</span>${label}</a>`;
  return `<nav class="bottom-nav">
    ${item("/", "🏠", "Home", "home")}
    ${item("/watchlater", "📌", "Later", "watchlater")}
    ${item("/users", "👥", "Users", "users")}
    ${item("/claimed", "🎬", "Claimed", "claimed")}
    ${session ? `<a class="bn-item ${active === "notifications" ? "active" : ""}" href="/notifications" id="bnNotifItem"><span class="bn-icon">🔔</span>Alerts<span class="bn-badge" id="bnNotifBadge" style="display:none;"></span></a>` : ""}
    ${session ? item("/profile/" + session.username, "👤", "Profile", "profile") : item("/login", "👤", "Login", "profile")}
  </nav>`;
}

// ─── Background music player (NEW — Feature: Site Background Music) ────────
// One shared <audio> per page load. Config is fetched from a small public
// API (/api/background-music) rather than threaded through every page-render
// function, so this can be dropped into `shell()` without touching every
// caller. Mute preference persists in localStorage; playback position
// persists in sessionStorage so a fresh page load (this is a full-page-nav
// app, not an SPA) resumes near where it left off instead of restarting the
// track from 0 every navigation. Never rendered on the watch page (callers
// simply don't pass opts.music there), so it's automatically stopped/absent
// while a movie is open — see NAVIGATION REQUIREMENT / VIDEO WATCH BEHAVIOR.
function musicPlayerWidget() {
  return `
  <audio id="bgMusicAudio" preload="none"></audio>
  <button type="button" class="music-toggle" id="bgMusicToggle" style="display:none;" title="Background music">🔊</button>
  <div class="music-title-toast" id="bgMusicToast"></div>
  <script>
  (function(){
    var audio = document.getElementById('bgMusicAudio');
    var btn = document.getElementById('bgMusicToggle');
    var toast = document.getElementById('bgMusicToast');
    var cfg = null;
    var armedForGesture = false;

    function isMuted() {
      try { return localStorage.getItem('backgroundMusicMuted') === 'true'; } catch(e) { return false; }
    }
    function setMuted(v) {
      try { localStorage.setItem('backgroundMusicMuted', v ? 'true' : 'false'); } catch(e) {}
    }
    function showToast(text) {
      if (!text) return;
      toast.textContent = text;
      toast.classList.add('show');
      setTimeout(function(){ toast.classList.remove('show'); }, 3000);
    }
    function updateBtn() {
      var muted = isMuted();
      btn.textContent = muted ? '🔇' : '🔊';
      btn.classList.toggle('muted', muted);
    }
    function savePos() {
      if (!audio.duration) return;
      try { sessionStorage.setItem('bgMusicPos', String(audio.currentTime || 0)); } catch(e) {}
    }
    function attemptPlay() {
      if (!cfg || !cfg.enabled || !cfg.src || isMuted()) return;
      var p = audio.play();
      if (p && p.catch) {
        p.then(function(){ showToast(cfg.title || ''); }).catch(function(){
          // Autoplay blocked — do NOT retry in a loop or show an error.
          // Stay ready; the first permitted user interaction starts it.
          if (armedForGesture) return;
          armedForGesture = true;
          var start = function(){
            document.removeEventListener('click', start);
            document.removeEventListener('keydown', start);
            document.removeEventListener('touchstart', start);
            if (!isMuted()) attemptPlay();
          };
          document.addEventListener('click', start, { once: true });
          document.addEventListener('keydown', start, { once: true });
          document.addEventListener('touchstart', start, { once: true });
        });
      }
    }

    fetch('/api/background-music', { credentials: 'same-origin' }).then(function(r){ return r.json(); }).then(function(data){
      cfg = data;
      if (!cfg || !cfg.enabled || !cfg.src) return; // ADMIN MUSIC DISABLED / NO DRIVE ID → never start
      btn.style.display = 'flex';
      audio.loop = !!cfg.loop;
      audio.volume = typeof cfg.volume === 'number' ? cfg.volume : 0.35;
      audio.src = cfg.src;
      updateBtn();
      var savedPos = 0;
      try { savedPos = parseFloat(sessionStorage.getItem('bgMusicPos') || '0') || 0; } catch(e) {}
      if (savedPos > 0) {
        audio.addEventListener('loadedmetadata', function once(){
          audio.removeEventListener('loadedmetadata', once);
          if (savedPos < audio.duration) audio.currentTime = savedPos;
        });
      }
      if (!isMuted() && cfg.autoplay !== false) attemptPlay(); // USER MUTED, or admin turned autoplay off → don't auto-start
    }).catch(function(){});

    btn.addEventListener('click', function(){
      var nowMuted = !isMuted();
      setMuted(nowMuted);
      updateBtn();
      if (nowMuted) { audio.pause(); }
      else { attemptPlay(); }
    });

    setInterval(savePos, 3000);
    document.addEventListener('visibilitychange', function(){ if (document.hidden) savePos(); });
    window.addEventListener('pagehide', savePos);
  })();
  </script>`;
}

// ─── SPA-style client-side navigation (NEW — keeps the background music
// player alive across normal browsing) ──────────────────────────────────────
// The page shell is split into a persistent outer document (this script, the
// <audio> element, its toggle button/toast) and a swappable inner container
// (#spaRoot) holding the actual page markup. `opts.spa` is only set true for
// "normal" browsing routes (home "/", "/watchlater", "/profile/:username",
// "/checkin", "/claimed") — i.e. exactly the routes that also get
// `opts.music`. Every other route (the /watch player, /admin, /login,
// /signup, OAuth, logout, direct downloads, etc.) is intentionally left as a
// plain server-rendered page with no spaRoot/script, so clicking into or out
// of those still does a full navigation — which is what correctly stops the
// music on /watch (see WATCH PAGE RULE) and keeps every other flow (OAuth,
// admin, purchases...) exactly as before.
//
// On a click/GET-form-submit toward one of those SPA routes, we fetch the
// destination as plain HTML (the same full document the server would
// otherwise render), pull out *its* #spaRoot innerHTML + <title> with
// DOMParser, and splice that into the current document's #spaRoot. Because
// the <audio id="bgMusicAudio"> element (and its <script>) lives outside
// #spaRoot, it's never touched by this swap — same tag, same playback
// state, same position, continuously across Home → Watch Later → Profile →
// Categories → Search → Home, etc. Browser Back/Forward is handled the same
// way via popstate.
function spaNavScript() {
  return `
  <script>
  (function(){
    var root = document.getElementById('spaRoot');
    if (!root) return;

    function isSpaUrl(href) {
      var u;
      try { u = new URL(href, location.href); } catch(e) { return false; }
      if (u.origin !== location.origin) return false;
      var p = u.pathname;
      return p === '/' || p === '/watchlater' || p === '/checkin' || p === '/claimed' || p === '/users' || p.indexOf('/profile/') === 0;
    }

    function execScripts(container) {
      var olds = container.querySelectorAll('script');
      for (var i = 0; i < olds.length; i++) {
        var old = olds[i];
        if (old.type && old.type !== 'text/javascript') continue; // skip json-ld etc.
        var s = document.createElement('script');
        if (old.src) { s.src = old.src; } else { s.textContent = old.textContent; }
        old.parentNode.replaceChild(s, old); // executes in global scope, in place
      }
    }

    function applyDoc(html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var newRoot = doc.getElementById('spaRoot');
      if (!newRoot) return false; // destination isn't an SPA page — caller falls back to a real nav
      root.innerHTML = newRoot.innerHTML;
      if (doc.title) document.title = doc.title;
      window.scrollTo(0, 0);
      execScripts(root);
      return true;
    }

    var navSeq = 0;
    function goTo(url, push) {
      var seq = ++navSeq;
      fetch(url, { credentials: 'same-origin' }).then(function(r) {
        if (!r.ok) return Promise.reject();
        return r.text();
      }).then(function(html) {
        if (seq !== navSeq) return; // superseded by a newer navigation
        if (!applyDoc(html)) { location.href = url; return; }
        if (push) history.pushState({ spaNav: true }, '', url);
      }).catch(function() { location.href = url; });
    }

    document.addEventListener('click', function(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a');
      if (!a || !a.href) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      if (a.dataset && a.dataset.noSpa !== undefined) return;
      var raw = a.getAttribute('href') || '';
      if (!raw || raw.charAt(0) === '#') return;
      if (!isSpaUrl(a.href)) return; // e.g. /watch, /admin, /login, external — real navigation
      e.preventDefault();
      if (a.href === location.href) return;
      goTo(a.href, true);
    });

    document.addEventListener('submit', function(e) {
      var f = e.target;
      if (!f || f.tagName !== 'FORM') return;
      var method = (f.getAttribute('method') || 'GET').toUpperCase();
      if (method !== 'GET') return; // POSTs (purchases, comments, etc.) are untouched
      var action = f.getAttribute('action') || location.pathname;
      if (!isSpaUrl(action)) return;
      e.preventDefault();
      var qs = new URLSearchParams(new FormData(f)).toString();
      goTo(action.split('?')[0] + (qs ? '?' + qs : ''), true);
    });

    window.addEventListener('popstate', function() {
      goTo(location.href, false);
    });
  })();
  </script>`;
}

function shell(title, body, opts = {}) {
  const branding = opts.branding;
  const favicon = faviconTag(branding);
  const accentStyle = accentStyleTag(branding);
  const seo = seoMetaTags(branding, { title, ...(opts.seo || {}) });
  const manifestLink = `<link rel="manifest" href="/manifest.json">`;
  const themeColorMeta = branding ? `<meta name="theme-color" content="${escapeHtml(sanitizeHexColor(branding.pwaThemeColor || branding.accentColor, "#e50914"))}">` : "";
  const announcement = opts.skipAnnouncement ? "" : announcementHtml(branding);
  const footer = opts.skipFooter ? "" : footerHtml(branding);
  return `<!DOCTYPE html><html lang="en"><head><title>${escapeHtml(title)}</title>${favicon}${manifestLink}${themeColorMeta}${seo}${HEAD}${accentStyle}</head><body>${themeBootScript(branding && branding.defaultTheme)}${announcement}<div id="spaRoot">${body}</div>${footer}${opts.music ? musicPlayerWidget() : ""}${opts.spa ? spaNavScript() : ""}${opts.skipDangerZone ? "" : dangerZoneScript()}${adBlockProtectionScript(branding)}</body></html>`;
}

// Only allow same-site relative paths (e.g. "/watch?id=..."), never a full
// URL/protocol, so the post-login redirect can't be used as an open redirect.
function safeReturnPath(raw) {
  const v = (raw || "").toString();
  if (!v || v[0] !== "/" || v.startsWith("//") || v.indexOf("\\") !== -1) return "";
  return v;
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}


// ─── KV Helpers ─────────────────────────────────────────────────────────────

async function getVideos(env) {
  const raw = await env.VIDEOS.get("video_list");
  return raw ? JSON.parse(raw) : [];
}
async function saveVideos(env, list) {
  await env.VIDEOS.put("video_list", JSON.stringify(list));
}

// Publicly visible videos: not soft-deleted, not admin-hidden, and either
// unscheduled or publishAt has passed. `hidden` (NEW) only affects listings —
// same precedent as hidden categories — direct /watch links still work.
function isPublished(v) {
  if (v.deleted) return false;
  if (v.hidden) return false;
  if (v.draft) return false;
  if (v.publishAt && Number(v.publishAt) > Date.now()) return false;
  return true;
}
function isScheduledFuture(v) {
  return !!(v.publishAt && Number(v.publishAt) > Date.now());
}

async function getUser(env, emailOrUsername) {
  const needle = emailOrUsername.toLowerCase();
  const raw = await env.VIDEOS.get("user:" + needle);
  return raw ? JSON.parse(raw) : null;
}

async function saveUser(env, user) {
  await env.VIDEOS.put("user:" + user.email.toLowerCase(), JSON.stringify(user));
}

async function createUser(env, email, username, name, password, referredBy, signupIp, deviceId) {
  const passwordHash = await hashPassword(env, password, email);
  const referralCode = crypto.randomUUID().slice(0, 8).toUpperCase();
  const user = {
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    name,
    passwordHash,
    coins: 50,
    isBanned: false,
    banReason: null,
    isActive: true,
    provider: "password",   // "password" | "google" — how this account authenticates
    verified: false,        // admin-controlled verification badge (Google sign-ins are auto-verified)
    referralCode,
    referredBy: referredBy || null,
    signupIp: signupIp || null,
    deviceId: deviceId || null,
    lastLoginIp: signupIp || null,
    lastLoginAt: Date.now(),
    localResetToken: 0,
    createdAt: Date.now(),
    isPrivate: false,       // admin can hide this user's profile/coins/leaderboard spot from other users
    lastSeen: Date.now(),   // updated on every /api/heartbeat — drives the admin "real-time active users" view
    totalStayMinutes: 0,    // lifetime accumulated active minutes on the site
    totalEarned: 0,         // lifetime coins earned (positive adjustments only) — powers the Top Earners leaderboard
    referralCount: 0,       // number of people who signed up using this user's referral code — shown on public profile
    checkinStreak: 0,       // consecutive daily check-ins
    lastCheckinDate: null,  // YYYY-MM-DD (UTC) of the last successful check-in, used to compute the streak
    usernameSet: true       // password-signup users already chose their username at signup
  };
  await env.VIDEOS.put("user:" + email.toLowerCase(), JSON.stringify(user));
  await env.VIDEOS.put("user_username:" + username.toLowerCase(), email.toLowerCase());
  await env.VIDEOS.put("user_referral:" + referralCode, email.toLowerCase());
  return user;
}

// Creates an account via Google Sign-In. No password is set (passwordHash
// stays null), so classic password login is disabled for this account until
// the user explicitly sets one — see the /login handler's provider check.
async function createGoogleUser(env, email, username, name, referredBy, signupIp, googleSub, avatar) {
  const referralCode = crypto.randomUUID().slice(0, 8).toUpperCase();
  const user = {
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    name,
    passwordHash: null,
    coins: 50,
    isBanned: false,
    banReason: null,
    isActive: true,
    provider: "google",
    googleSub: googleSub || null,
    avatar: avatar || null,
    verified: true,          // Google has already confirmed ownership of this email address
    referralCode,
    referredBy: referredBy || null,
    signupIp: signupIp || null,
    deviceId: null,
    lastLoginIp: signupIp || null,
    lastLoginAt: Date.now(),
    localResetToken: 0,
    createdAt: Date.now(),
    isPrivate: false,
    lastSeen: Date.now(),
    totalStayMinutes: 0,
    totalEarned: 0,
    referralCount: 0,
    checkinStreak: 0,
    lastCheckinDate: null,
    usernameSet: false   // true once the user picks their own username at /choose-username; until then `username` is auto-generated from their email
  };
  await env.VIDEOS.put("user:" + email.toLowerCase(), JSON.stringify(user));
  await env.VIDEOS.put("user_username:" + username.toLowerCase(), email.toLowerCase());
  await env.VIDEOS.put("user_referral:" + referralCode, email.toLowerCase());
  return user;
}

// Picks a unique username from an email's local-part (for Google sign-ups,
// which don't collect a username during the OAuth flow).
async function uniqueUsernameFromEmail(env, email) {
  let base = (email.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  if (!base) base = "user";
  let candidate = base;
  let i = 0;
  while (await env.VIDEOS.get("user_username:" + candidate)) {
    i += 1;
    candidate = (base.slice(0, 17) + i).slice(0, 20);
  }
  return candidate;
}

// Increments the referrer's referralCount (always, for public-profile display)
// and — if the site's referralSignupBonus setting is > 0 — credits both
// parties. Called from both the password signup flow and the Google
// OAuth signup flow so referral tracking behaves identically either way.
async function applyReferralSignup(env, referrerEmail, newUserEmail, newUserName) {
  if (!referrerEmail) return;
  const referrer = await getUser(env, referrerEmail);
  if (referrer) {
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    await saveUser(env, referrer);
    await checkAndAwardAchievements(env, referrerEmail);
  }
  const settings = await getSettings(env);
  if (settings.referralSignupBonus > 0) {
    await adjustUserCoins(env, referrerEmail, settings.referralSignupBonus, "Referral signup bonus", { type: "referral_signup", notifySuffix: `because ${newUserName} signed up with your referral code` });
    await adjustUserCoins(env, newUserEmail, settings.referralSignupBonus, "Referral signup bonus", { type: "referral_signup", notify: false });
  }
}

// ─── Duplicate-account guard (one account per IP / per device) ──────────────

async function getIpAccounts(env, ip) {
  if (!ip || ip === "unknown") return [];
  const raw = await env.VIDEOS.get("ip_accounts:" + ip);
  return raw ? JSON.parse(raw) : [];
}
async function addIpAccount(env, ip, email) {
  if (!ip || ip === "unknown") return;
  const list = await getIpAccounts(env, ip);
  if (!list.includes(email)) {
    list.push(email);
    await env.VIDEOS.put("ip_accounts:" + ip, JSON.stringify(list));
  }
}
async function getDeviceAccounts(env, deviceId) {
  if (!deviceId) return [];
  const raw = await env.VIDEOS.get("device_accounts:" + deviceId);
  return raw ? JSON.parse(raw) : [];
}
async function addDeviceAccount(env, deviceId, email) {
  if (!deviceId) return;
  const list = await getDeviceAccounts(env, deviceId);
  if (!list.includes(email)) {
    list.push(email);
    await env.VIDEOS.put("device_accounts:" + deviceId, JSON.stringify(list));
  }
}
// Returns the first still-existing (non-deleted) user found among a list of emails.
async function firstLiveAccount(env, emails) {
  for (const e of emails) {
    const u = await getUser(env, e);
    if (u) return u;
  }
  return null;
}

// ─── Settings (site-wide configurable values) ────────────────────────────────

const SETTINGS_DEFAULTS = {
  downloadCost: 10,
  referralSignupBonus: 20,
  referralPurchaseCommission: 1,
  dailyCheckinCoins: 5,
  activeTimeThresholdMinutes: 30,
  activeTimeBaseCoins: 5,
  activeTimeChunkMinutes: 10,
  activeTimeChunkCoins: 1,
  activeTimeDailyCapMinutes: 180, // hard daily cap on rewarded/counted active minutes — prevents idle-tab farming
  checkinStreakIntervalDays: 7,   // award a bonus every N consecutive check-in days
  checkinStreakBonusCoins: 15,    // bonus coins awarded when the streak interval is hit
  siteMode: "paid", // "paid" | "free" — admin-wide toggle; "free" makes every video watch/download free
  accountRequired: true, // Admin → Access Control. true (default) = unchanged current behavior (login/signup required to watch). false = guests may watch content that's already free/public under the site's existing rules, without an account; paid content, downloads, and account-only features are unaffected — see isAccountRequired().
  globalLocalResetToken: 0, // bumped by "Reset ALL users' local data" — every client clears its localStorage when it sees a new value
  giftReverseWindowMinutes: 360, // default 6 hours — how long a sender can reverse a gift
  newUserStartingCoins: 0, // balance a user is set to after a Complete Account Reset
  liveAnalyticsEnabled: true, // admin on/off switch — when false, the Analytics tab and live-viewers badge show nothing to non-admin requests; the logged-in admin always sees full data regardless of this setting

  // ── Ad-blocker protection (NEW — Admin → 📢 Ads) — admin on/off switch.
  // When enabled, every page runs a client-side ad-blocker detection script;
  // visitors with an ad blocker active see a blocking overlay with a
  // configurable message until they disable it (or dismiss, if allowed).
  adBlockProtectionEnabled: false,
  adBlockProtectionMessage: "We noticed an ad blocker is active. Please disable it to support the site and continue watching — ads keep this content free.",
  adBlockProtectionDismissible: true, // when true, visitors can dismiss the overlay and keep browsing; when false it's a hard wall

  // ── Daily achievement tasks / milestones (NEW — Admin → 🏆 Achievements) ──
  // admin on/off switch. When enabled, users unlock one-time coin rewards for
  // hitting lifetime milestones (watch time, referrals, purchases, check-in
  // streaks, reviews). See ACHIEVEMENT_DEFAULTS below for the editable list.
  achievementsEnabled: false,
  achievements: null, // null = use ACHIEVEMENT_DEFAULTS; once admin saves, an array overrides it
  googleClientId: "",     // Google OAuth 2.0 Client ID — set from Admin → Settings
  googleClientSecret: "", // Google OAuth 2.0 Client Secret — set from Admin → Settings

  // ── Player skin & ad breaks (NEW — Admin → 🎬 Player) — controls the
  // "Reel" video player used on every /watch page (film-reel skin, custom
  // overlay controls, keyboard shortcuts, simulated pre-roll/mid-roll ad
  // breaks). All of it is admin-toggleable; nothing here is hardcoded.
  player: {
    adsEnabled: false,          // master switch for pre-roll/mid-roll ad breaks
    prerollSeconds: 12,         // pre-roll ad length, plays once per video before first play
    midrollSeconds: 8,          // mid-roll ad length
    midrollAtPercent: 50,       // where in playback (%) the mid-roll fires
    skipAfterSeconds: 5,        // seconds before the "Skip ad" button appears
    adHeadline: "Advertisement",
    adSubtext: "Your video resumes automatically",
    keyboardShortcuts: true,    // space / arrows / M / F
    reelAnimation: true,        // spinning film-reel decoration above the screen
    showSpeedControl: true,
    resumePlayback: true,       // remember & restore playback position via localStorage
    autoNextDefault: true       // "Auto next" checkbox default state
  },

  // ── Site background music (NEW) — configured from Admin → 🎵 Background Music ──
  backgroundMusic: {
    enabled: false,
    driveId: "",   // Google Drive file ID for the MP3, reuses the existing video Drive proxy
    title: "",
    loop: true,
    volume: 0.35,
    autoplay: true // NEW — when off, music is loaded/ready but won't start until the user taps the 🔊 toggle
  },
  // ── Release date display (NEW) — global on/off for showing 📅 Released: ... to users.
  // Purely cosmetic: releaseDate is still used for sorting/availability either way.
  showReleaseDate: true,

  // ── Site branding (Admin → 🎨 Branding). All purely cosmetic/display;
  // nothing here affects auth, sorting, coins, or any other data. This is the
  // single source of truth for every brand/SEO/theme/footer/social value —
  // pages read from getBranding(env), never hard-coded strings.
  siteName: "TAMIZH ZORA",        // shown in header wordmark, footer, auth pages, etc.
  shortName: "",               // compact name for mobile/PWA contexts; falls back to siteName
  browserTitle: "TAMIZH ZORA",    // global fallback <title>, combined with page-specific prefixes via brandTitle()
  siteLogo: "",                // optional image URL/Drive ID — used instead of the text wordmark in the header
  mobileLogo: "",              // optional separate logo for small screens; falls back to siteLogo
  faviconUrl: "",              // optional favicon URL/Drive ID, rendered as <link rel="icon">
  siteDescription: "",         // used as the fallback meta description / OG description

  // SEO / social sharing
  seoTitle: "",                // overrides browserTitle in <meta>/OG tags when set
  seoDescription: "",          // overrides siteDescription in <meta>/OG tags when set
  seoKeywords: "",             // comma-separated
  siteUrl: "",                 // e.g. https://example.com — used to build canonical/OG URLs
  canonicalUrl: "",            // overrides siteUrl for <link rel="canonical"> when set
  ogImage: "",                 // default Open Graph share image URL/Drive ID

  // Theme
  defaultTheme: "dark",        // "dark" | "light" | "system" — default for visitors with no saved preference
  accentColor: "#e50914",
  pwaThemeColor: "",           // falls back to accentColor
  pwaBackgroundColor: "#0b0b0f",

  // Footer
  footerText: "",
  copyrightText: "",
  autoCopyrightYear: true,

  // Social links (all optional; only shown when set)
  socialLinks: { facebook: "", instagram: "", youtube: "", telegram: "", twitter: "" },

  // Header announcement bar
  announcementEnabled: false,
  announcementText: "",
  announcementUrl: "",

  // PWA
  pwaName: "",                 // falls back to siteName
  pwaShortName: "",            // falls back to shortName / siteName
  pwaIcon: ""                  // falls back to siteLogo/faviconUrl
};

// ── Achievement catalog (NEW) ────────────────────────────────────────────────
// Each entry is a one-time lifetime milestone: hit `threshold` on `stat` and
// get `coins` once. `stat` must be a key produced by computeUserStats() below.
// Admins can edit thresholds/coins/enabled per-achievement from
// Admin → 🏆 Achievements, or add their own; this list is just the shipped
// starting point (and the fallback whenever settings.achievements is null).
const ACHIEVEMENT_DEFAULTS = [
  { id: "watch_10h", label: "Binge Starter", description: "Spend 10 hours total on the site", stat: "watchHours", threshold: 10, coins: 10, enabled: true },
  { id: "watch_50h", label: "Movie Buff", description: "Spend 50 hours total on the site", stat: "watchHours", threshold: 50, coins: 30, enabled: true },
  { id: "watch_100h", label: "Certified Cinephile", description: "Spend 100 hours total on the site", stat: "watchHours", threshold: 100, coins: 50, enabled: true },
  { id: "watch_250h", label: "Screen Legend", description: "Spend 250 hours total on the site", stat: "watchHours", threshold: 250, coins: 120, enabled: true },
  { id: "checkin_streak_7", label: "Week Streaker", description: "Keep a 7-day check-in streak", stat: "checkinStreak", threshold: 7, coins: 15, enabled: true },
  { id: "checkin_streak_30", label: "Monthly Regular", description: "Keep a 30-day check-in streak", stat: "checkinStreak", threshold: 30, coins: 60, enabled: true },
  { id: "referrals_5", label: "Recruiter", description: "Refer 5 friends who sign up", stat: "referralCount", threshold: 5, coins: 25, enabled: true },
  { id: "referrals_20", label: "Community Builder", description: "Refer 20 friends who sign up", stat: "referralCount", threshold: 20, coins: 80, enabled: true },
  { id: "purchases_10", label: "Collector", description: "Unlock 10 videos or series", stat: "purchaseCount", threshold: 10, coins: 20, enabled: true },
  { id: "purchases_50", label: "Super Collector", description: "Unlock 50 videos or series", stat: "purchaseCount", threshold: 50, coins: 100, enabled: true },
  { id: "reviews_10", label: "Critic", description: "Leave 10 ratings/reviews", stat: "reviewCount", threshold: 10, coins: 15, enabled: true },
  { id: "profile_early", label: "Early Bird", description: "Verify your account within your first week", stat: "accountAgeDaysVerified", threshold: 1, coins: 5, enabled: false }
];

// Reject dangerous URL schemes (javascript:, data:, vbscript:, etc.) in any
// admin-supplied URL field. Bare Google Drive IDs and root-relative paths
// ("/x") are allowed through since resolveBrandingAsset/social links treat
// them as safe by construction; only an explicit scheme is checked.
function sanitizeUrl(value) {
  const v = (value || "").toString().trim();
  if (!v) return "";
  const schemeMatch = v.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") return "";
  }
  return v.slice(0, 500);
}

// Plain-text branding field: strips any HTML tags so admin-entered text can
// never inject markup/scripts even before escapeHtml() runs at render time.
function sanitizeText(value, maxLen = 300) {
  return (value || "").toString().replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

function sanitizeHexColor(value, fallback) {
  const v = (value || "").toString().trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : fallback;
}

// Resolve a stored branding value (logo/favicon) into a safe, renderable URL.
// Accepts either a full http(s) URL or a bare Google Drive file ID (reusing
// the existing signed-proxy mechanism other Drive-backed assets use), so
// admins can paste either without needing to know which one they have.
async function resolveBrandingAsset(env, value) {
  const v = (value || "").toString().trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  // Otherwise treat it as a Google Drive file ID via the existing proxy.
  try { return await buildSignedSrc(env.DRIVE_PROXY_BASE, v, env.LINK_SECRET); }
  catch (e) { return ""; }
}

function isFreeMode(settings) {
  return settings && settings.siteMode === "free";
}

// Admin → Access Control. Defaults to true (current/original behavior:
// an account is required before a guest can watch anything). When an admin
// explicitly sets this to false, guests may watch content that's already
// eligible for free/public access under the site's existing rules (free-mode
// videos, or individual videos with coinCost 0) without creating an account.
// This never affects paid content, downloads, or any account-only feature —
// those keep requiring a real session exactly as before either way.
function isAccountRequired(settings) {
  return !settings || settings.accountRequired !== false;
}

async function getSettings(env) {
  const raw = await env.VIDEOS.get("settings");
  const stored = raw ? JSON.parse(raw) : {};
  return {
    ...SETTINGS_DEFAULTS,
    ...stored,
    // Shallow top-level spread would clobber missing sub-fields if an old/partial
    // record is stored — merge nested objects one level deep so new sub-fields
    // (added later) always have a safe default even for existing saved settings.
    backgroundMusic: { ...SETTINGS_DEFAULTS.backgroundMusic, ...(stored.backgroundMusic || {}) },
    socialLinks: { ...SETTINGS_DEFAULTS.socialLinks, ...(stored.socialLinks || {}) },
    player: { ...SETTINGS_DEFAULTS.player, ...(stored.player || {}) }
  };
}
async function saveSettings(env, s) {
  await env.VIDEOS.put("settings", JSON.stringify(s));
}

// Branding = settings + every logo/favicon/OG-image field resolved into an
// actually-renderable URL (a Drive ID becomes a signed proxy URL, same as
// video/music assets; a full http(s) URL passes through unchanged). Call
// this instead of getSettings() wherever a page needs to render the
// header/title/meta/footer; everywhere else the plain settings object is fine.
async function getBranding(env) {
  const settings = await getSettings(env);
  const [siteLogoHref, mobileLogoHref, faviconHref, ogImageHref, pwaIconHref] = await Promise.all([
    resolveBrandingAsset(env, settings.siteLogo),
    resolveBrandingAsset(env, settings.mobileLogo || settings.siteLogo),
    resolveBrandingAsset(env, settings.faviconUrl),
    resolveBrandingAsset(env, settings.ogImage),
    resolveBrandingAsset(env, settings.pwaIcon || settings.siteLogo || settings.faviconUrl)
  ]);
  return { ...settings, siteLogoHref, mobileLogoHref, faviconHref, ogImageHref, pwaIconHref };
}

// Header wordmark: the configured logo image if set, otherwise a text
// wordmark derived from the configured site name (falls back to the
// original "TAMIZH|ZORA" gold-accent split when the name is still the default).
// Uses mobileLogoHref (falls back to siteLogoHref) on small screens via a
// simple CSS class pair so admins can supply a distinct compact mark.
function wordmarkHtml(branding) {
  const name = ((branding && branding.siteName) || "TAMIZH ZORA").toString();
  if (branding && branding.siteLogoHref) {
    const mobileHref = (branding.mobileLogoHref && branding.mobileLogoHref !== branding.siteLogoHref) ? branding.mobileLogoHref : branding.siteLogoHref;
    if (mobileHref !== branding.siteLogoHref) {
      return `<img class="wordmark-logo wordmark-logo-desktop" src="${escapeHtml(branding.siteLogoHref)}" alt="${escapeHtml(name)}" style="height:32px;max-width:220px;object-fit:contain;">` +
             `<img class="wordmark-logo wordmark-logo-mobile" src="${escapeHtml(mobileHref)}" alt="${escapeHtml(name)}" style="height:32px;max-width:220px;object-fit:contain;">`;
    }
    return `<img class="wordmark-logo" src="${escapeHtml(branding.siteLogoHref)}" alt="${escapeHtml(name)}" style="height:32px;max-width:220px;object-fit:contain;">`;
  }
  const accentLen = Math.min(4, Math.max(1, Math.ceil(name.length / 3)));
  const head = name.slice(0, Math.max(0, name.length - accentLen));
  const tail = name.slice(Math.max(0, name.length - accentLen));
  return `<div class="wordmark">${escapeHtml(head)}<span>${escapeHtml(tail)}</span></div>`;
}

// <title>...</title> text builder: combines a page-specific prefix with the
// admin-configured site name/browser title, without ever producing something
// malformed (e.g. "undefined —") if a piece is missing.
function brandTitle(branding, prefix) {
  const site = (branding && (branding.browserTitle || branding.siteName)) || "TAMIZH ZORA";
  return prefix ? `${prefix} — ${site}` : site;
}

// Ad Blocker Protection (NEW — Admin → 📢 Ads → toggle). Renders nothing
// unless settings.adBlockProtectionEnabled is true. Uses the standard
// "bait element" technique: a div styled/classed the way ad blockers filter
// on is added off-screen; if it gets hidden/zero-sized shortly after, an
// ad blocker is active and a message overlay (dismissible or a hard wall,
// per admin setting) is shown.
function adBlockProtectionScript(branding) {
  if (!branding || !branding.adBlockProtectionEnabled) return "";
  const msg = (branding.adBlockProtectionMessage || SETTINGS_DEFAULTS.adBlockProtectionMessage).toString();
  const dismissible = branding.adBlockProtectionDismissible !== false;
  return `<script>
  (function(){
    var msg = ${JSON.stringify(msg)};
    var dismissible = ${JSON.stringify(dismissible)};
    function showOverlay(){
      if (document.getElementById('adblockOverlay') || !document.body) return;
      var overlay = document.createElement('div');
      overlay.id = 'adblockOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(8,10,16,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
      var box = document.createElement('div');
      box.style.cssText = 'background:var(--bg-panel,#161D2E);border:1px solid var(--border,#2A3352);border-radius:14px;padding:28px;max-width:420px;text-align:center;color:var(--text-warm,#F2EDE4);font-family:Inter,sans-serif;';
      var icon = document.createElement('div'); icon.style.cssText = 'font-size:38px;margin-bottom:10px;'; icon.textContent = '🛡️';
      var h3 = document.createElement('h3'); h3.style.cssText = 'margin:0 0 10px;'; h3.textContent = 'Ad Blocker Detected';
      var p = document.createElement('p'); p.style.cssText = 'color:var(--text-dim,#8B93A7);font-size:13.5px;line-height:1.5;margin:0;'; p.textContent = msg;
      var btn = document.createElement('button');
      btn.style.cssText = 'margin-top:16px;background:var(--gold,#E8A33D);color:#1a1200;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;';
      if (dismissible) { btn.textContent = 'Continue anyway'; btn.onclick = function(){ overlay.remove(); }; }
      else { btn.textContent = "I've disabled it — Reload"; btn.onclick = function(){ location.reload(); }; }
      box.appendChild(icon); box.appendChild(h3); box.appendChild(p); box.appendChild(btn);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }
    function check(){
      if (!document.body) { document.addEventListener('DOMContentLoaded', check); return; }
      var bait = document.createElement('div');
      bait.className = 'adsbox ad-banner ads ad-placement adsbygoogle pub_300x250 textads banner_ad';
      bait.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:2px;height:2px;';
      document.body.appendChild(bait);
      setTimeout(function(){
        var blocked = !bait.offsetParent || bait.offsetHeight === 0 || bait.clientHeight === 0 || getComputedStyle(bait).display === 'none' || getComputedStyle(bait).visibility === 'hidden';
        if (bait.parentNode) bait.parentNode.removeChild(bait);
        if (blocked) showOverlay();
      }, 300);
    }
    check();
  })();
  </script>`;
}

function faviconTag(branding) {
  const href = branding && branding.faviconHref;
  if (!href) return "";
  // href is either a plain https URL or our own signed proxy URL — either
  // way it's attacker-uncontrollable HTML structure, just escape the value.
  return `<link rel="icon" href="${escapeHtml(href)}"><link rel="apple-touch-icon" href="${escapeHtml(href)}">`;
}

// Builds every SEO/OG/Twitter <meta> tag from centralized branding, with an
// optional page-specific override (title/description/image/type/url) taking
// priority over the branding-wide defaults. One function = one source of
// truth, so no page hand-rolls its own duplicate/conflicting tags.
function seoMetaTags(branding, page = {}) {
  const siteName = (branding && branding.siteName) || "TAMIZH ZORA";
  const title = page.title || brandTitle(branding, page.titlePrefix);
  const description = sanitizeText(page.description || (branding && (branding.seoDescription || branding.siteDescription)) || "", 300);
  const keywords = (branding && branding.seoKeywords) || "";
  const rawCanonicalBase = (branding && (branding.canonicalUrl || branding.siteUrl)) || "";
  const canonicalBase = sanitizeUrl(rawCanonicalBase).replace(/\/$/, "");
  const canonical = page.path && canonicalBase ? canonicalBase + page.path : (canonicalBase || "");
  const ogImage = sanitizeUrl(page.image || (branding && branding.ogImageHref) || "");
  const ogType = page.type || "website";
  const tags = [
    `<meta name="description" content="${escapeHtml(description)}">`,
    keywords ? `<meta name="keywords" content="${escapeHtml(sanitizeText(keywords, 300))}">` : "",
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : "",
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="${escapeHtml(ogType)}">`,
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">` : "",
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : "",
    `<meta property="og:site_name" content="${escapeHtml(siteName)}">`,
    `<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ""
  ];
  return tags.filter(Boolean).join("");
}

// Injects the admin-configured accent color as CSS variable overrides so the
// rest of the stylesheet (which already uses var(--gold)/var(--accent)-style
// tokens) picks it up everywhere without a second theme system.
function accentStyleTag(branding) {
  const accent = sanitizeHexColor(branding && branding.accentColor, "#e50914");
  return `<style>:root{--gold:${accent};--accent:${accent};}</style>`;
}

function footerHtml(branding) {
  const siteName = (branding && branding.siteName) || "TAMIZH ZORA";
  const year = new Date().getFullYear();
  const copyright = branding && branding.copyrightText
    ? sanitizeText(branding.copyrightText, 200)
    : `© ${year} ${siteName}. All rights reserved.`;
  const copyrightFinal = (branding && branding.autoCopyrightYear !== false)
    ? copyright.replace(/©\s*\d{4}/, `© ${year}`)
    : copyright;
  const footerText = branding && branding.footerText ? sanitizeText(branding.footerText, 400) : "";
  const social = (branding && branding.socialLinks) || {};
  const socialDefs = [
    ["facebook", "Facebook", "📘"], ["instagram", "Instagram", "📷"], ["youtube", "YouTube", "▶️"],
    ["telegram", "Telegram", "✈️"], ["twitter", "X / Twitter", "𝕏"]
  ];
  const socialLinksHtml = socialDefs
    .filter(([key]) => social[key] && sanitizeUrl(social[key]))
    .map(([key, label, icon]) => `<a href="${escapeHtml(sanitizeUrl(social[key]))}" target="_blank" rel="noopener noreferrer nofollow" aria-label="${escapeHtml(label)}" class="footer-social-link">${icon}</a>`)
    .join("");
  return `
    <footer class="site-footer">
      ${footerText ? `<div class="footer-text">${escapeHtml(footerText)}</div>` : ""}
      ${socialLinksHtml ? `<div class="footer-social">${socialLinksHtml}</div>` : ""}
      <div class="footer-copyright">${escapeHtml(copyrightFinal)}</div>
    </footer>`;
}

function announcementHtml(branding) {
  if (!branding || !branding.announcementEnabled || !branding.announcementText) return "";
  const text = sanitizeText(branding.announcementText, 200);
  if (!text) return "";
  const link = sanitizeUrl(branding.announcementUrl);
  const inner = escapeHtml(text);
  return `
    <div class="site-announcement" id="siteAnnouncement">
      ${link ? `<a href="${escapeHtml(link)}" class="announcement-link">${inner}</a>` : `<span>${inner}</span>`}
      <button type="button" class="announcement-close" aria-label="Dismiss announcement" onclick="document.getElementById('siteAnnouncement').style.display='none';">✕</button>
    </div>`;
}

// PWA manifest — only meaningful if the admin has actually set PWA/branding
// fields; falls back to generic site branding either way so linking
// manifest.json never 404s or breaks the page it's linked from.
function manifestJson(branding) {
  const siteName = (branding && branding.siteName) || "TAMIZH ZORA";
  const name = (branding && branding.pwaName) || siteName;
  const shortName = (branding && (branding.pwaShortName || branding.shortName)) || name.slice(0, 12);
  const themeColor = sanitizeHexColor(branding && (branding.pwaThemeColor || branding.accentColor), "#e50914");
  const bgColor = sanitizeHexColor(branding && branding.pwaBackgroundColor, "#0b0b0f");
  const icon = (branding && branding.pwaIconHref) || "";
  return JSON.stringify({
    name: sanitizeText(name, 60),
    short_name: sanitizeText(shortName, 30),
    start_url: "/",
    display: "standalone",
    background_color: bgColor,
    theme_color: themeColor,
    icons: icon ? [{ src: icon, sizes: "512x512", type: "image/png", purpose: "any" }] : []
  });
}

// ─── Like / Dislike (with toggle + mutual exclusion) ────────────────────────

async function getLikeData(env, id) {
  const raw = await env.VIDEOS.get("likedata:" + id);
  return raw ? JSON.parse(raw) : { likes: 0, dislikes: 0, likedBy: [], dislikedBy: [] };
}
async function saveLikeData(env, id, data) {
  await env.VIDEOS.put("likedata:" + id, JSON.stringify(data));
}

async function getLikes(env, id) {
  const d = await getLikeData(env, id);
  return d.likes;
}
async function getDislikes(env, id) {
  const d = await getLikeData(env, id);
  return d.dislikes;
}

// Returns { likes, dislikes, userAction: 'liked'|'disliked'|null }
async function toggleLike(env, id, userId) {
  const d = await getLikeData(env, id);
  const alreadyLiked = d.likedBy.includes(userId);
  const alreadyDisliked = d.dislikedBy.includes(userId);

  if (alreadyLiked) {
    d.likedBy = d.likedBy.filter(u => u !== userId);
    d.likes = Math.max(0, d.likes - 1);
    await saveLikeData(env, id, d);
    return { likes: d.likes, dislikes: d.dislikes, userAction: null };
  }
  if (alreadyDisliked) {
    d.dislikedBy = d.dislikedBy.filter(u => u !== userId);
    d.dislikes = Math.max(0, d.dislikes - 1);
  }
  d.likedBy.push(userId);
  d.likes = d.likes + 1;
  await saveLikeData(env, id, d);
  return { likes: d.likes, dislikes: d.dislikes, userAction: "liked" };
}

async function toggleDislike(env, id, userId) {
  const d = await getLikeData(env, id);
  const alreadyDisliked = d.dislikedBy.includes(userId);
  const alreadyLiked = d.likedBy.includes(userId);

  if (alreadyDisliked) {
    d.dislikedBy = d.dislikedBy.filter(u => u !== userId);
    d.dislikes = Math.max(0, d.dislikes - 1);
    await saveLikeData(env, id, d);
    return { likes: d.likes, dislikes: d.dislikes, userAction: null };
  }
  if (alreadyLiked) {
    d.likedBy = d.likedBy.filter(u => u !== userId);
    d.likes = Math.max(0, d.likes - 1);
  }
  d.dislikedBy.push(userId);
  d.dislikes = d.dislikes + 1;
  await saveLikeData(env, id, d);
  return { likes: d.likes, dislikes: d.dislikes, userAction: "disliked" };
}

async function getUserLikeAction(env, id, userId) {
  if (!userId) return null;
  const d = await getLikeData(env, id);
  if (d.likedBy.includes(userId)) return "liked";
  if (d.dislikedBy.includes(userId)) return "disliked";
  return null;
}

async function resetLikes(env, id) {
  await saveLikeData(env, id, { likes: 0, dislikes: 0, likedBy: [], dislikedBy: [] });
}

// ─── Ratings / Reviews (separate from like/dislike) ──────────────────────────

async function getRatings(env, id) {
  const raw = await env.VIDEOS.get("ratings:" + id);
  return raw ? JSON.parse(raw) : [];
}
async function saveRatings(env, id, list) {
  await env.VIDEOS.put("ratings:" + id, JSON.stringify(list));
}
function ratingsSummary(list) {
  if (!list.length) return { avg: 0, count: 0 };
  const sum = list.reduce((a, r) => a + r.stars, 0);
  return { avg: Math.round((sum / list.length) * 10) / 10, count: list.length };
}
// One rating per user; posting again updates their existing rating.
async function addOrUpdateRating(env, id, userId, name, stars, text) {
  const list = await getRatings(env, id);
  const idx = list.findIndex(r => r.userId === userId);
  const entry = { id: idx !== -1 ? list[idx].id : crypto.randomUUID(), userId, name, stars, text: (text || "").slice(0, 500), time: new Date().toISOString() };
  if (idx !== -1) list[idx] = entry; else list.unshift(entry);
  await saveRatings(env, id, list);
  return list;
}
// Lets a user remove their own review/rating.
async function deleteOwnRating(env, id, userId) {
  let list = await getRatings(env, id);
  list = list.filter(r => r.userId !== userId);
  await saveRatings(env, id, list);
  return list;
}
// Admin: delete any review by its rating id.
async function deleteRatingById(env, id, ratingId) {
  let list = await getRatings(env, id);
  list = list.filter(r => r.id !== ratingId);
  await saveRatings(env, id, list);
  return list;
}
// Admin: edit any review's stars/text by its rating id.
async function editRatingById(env, id, ratingId, stars, text) {
  const list = await getRatings(env, id);
  const idx = list.findIndex(r => r.id === ratingId);
  if (idx !== -1) {
    list[idx].stars = stars;
    list[idx].text = (text || "").slice(0, 500);
  }
  await saveRatings(env, id, list);
  return list;
}
// Admin: post a new review as Admin (distinct synthetic userId so it doesn't
// merge with any real user's single review).
async function addAdminRating(env, id, name, stars, text) {
  const list = await getRatings(env, id);
  const entry = { id: crypto.randomUUID(), userId: "admin:" + crypto.randomUUID(), name: name || "Admin", stars, text: (text || "").slice(0, 500), time: new Date().toISOString(), isAdmin: true };
  list.unshift(entry);
  await saveRatings(env, id, list);
  return list;
}

// ─── Views ───────────────────────────────────────────────────────────────────

async function getViews(env, id) {
  const raw = await env.VIDEOS.get("views:" + id);
  return raw ? JSON.parse(raw) : { count: 0, viewedBy: [] };
}

// Deduplicated: one view per userId per 24h
async function incViews(env, id, userId, ip) {
  if (!userId) return (await getViews(env, id)).count;
  const views = await getViews(env, id);
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const existing = views.viewedBy.find(
    (v) => v.userId === userId && v.time > dayAgo
  );
  if (existing) return views.count;
  views.viewedBy.push({ userId, ip: ip || "unknown", time: Date.now() });
  views.count = views.viewedBy.length;
  await env.VIDEOS.put("views:" + id, JSON.stringify(views));
  return views.count;
}

async function resetViews(env, id) {
  await env.VIDEOS.put("views:" + id, JSON.stringify({ count: 0, viewedBy: [] }));
}

// ─── Watch history / taste profile (powers "Recommended for you") ──────────
// One compact record per confirmed watch (5+ min — see /api/view), newest
// first, deduplicated by video id, capped at 300. This is the only signal
// we need to build a lightweight YouTube-style personalization score: it
// tells us which categories/tags a user actually watches, not just clicks.

async function getWatchHistory(env, email) {
  const raw = await env.VIDEOS.get("history:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function recordWatchHistory(env, email, video) {
  let list = await getWatchHistory(env, email);
  list = list.filter((h) => h.id !== video.id); // de-dupe, most recent watch wins position
  list.unshift({ id: video.id, category: video.category || null, watchedAt: Date.now() });
  await env.VIDEOS.put("history:" + email.toLowerCase(), JSON.stringify(list.slice(0, 300)));
}

// Turns raw history into a simple taste profile: how many times each
// category was watched (recency-weighted so older watches matter less),
// plus the set of already-watched ids so recommendations can skip them.
function buildTasteProfile(history) {
  const categoryScore = {};
  const watchedIds = new Set();
  const now = Date.now();
  for (const h of history) {
    watchedIds.add(h.id);
    if (!h.category) continue;
    const ageDays = (now - (h.watchedAt || now)) / (24 * 60 * 60 * 1000);
    const weight = Math.max(0.15, Math.exp(-ageDays / 30)); // 30-day half-life-ish decay
    categoryScore[h.category] = (categoryScore[h.category] || 0) + weight;
  }
  return { categoryScore, watchedIds };
}

// Ranks candidate videos for a given taste profile the way a simplified
// YouTube-style feed would: personal category affinity is the dominant
// signal, blended with overall popularity, rating, and freshness so the
// row doesn't just echo the same category forever. Videos already watched
// are excluded (set excludeWatched=false for e.g. the watch-page sidebar,
// where re-surfacing a watched episode of a series is fine).
function rankForTaste(candidates, taste, { excludeWatched = true, excludeIds = [] } = {}) {
  const now = Date.now();
  const maxViews = Math.max(1, ...candidates.map((v) => v.views || 0));
  const skip = new Set(excludeIds);
  return candidates
    .filter((v) => !skip.has(v.id))
    .filter((v) => !(excludeWatched && taste.watchedIds.has(v.id)))
    .map((v) => {
      const categoryAffinity = (v.category && taste.categoryScore[v.category]) || 0;
      const popularity = Math.log(1 + (v.views || 0)) / Math.log(1 + maxViews); // 0..1
      const rating = (v.ratingSummary && v.ratingSummary.avg) || 0; // 0..5
      const ageDays = (now - (v.createdAt || now)) / (24 * 60 * 60 * 1000);
      const freshness = Math.max(0, 1 - ageDays / 21); // full boost for 0 days old, fades out over ~3 weeks
      const score = categoryAffinity * 3 + popularity * 1.6 + (rating / 5) * 1.2 + freshness * 1.4;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);
}

// ─── Purchase counters (for "most purchased" sort) ───────────────────────────

async function getPurchaseCount(env, id) {
  const raw = await env.VIDEOS.get("purchasecount:" + id);
  return raw ? parseInt(raw, 10) || 0 : 0;
}
async function incPurchaseCount(env, id) {
  const cur = await getPurchaseCount(env, id);
  await env.VIDEOS.put("purchasecount:" + id, String(cur + 1));
  return cur + 1;
}

// ─── Comments ────────────────────────────────────────────────────────────────

async function getComments(env, id) {
  const raw = await env.VIDEOS.get("comments:" + id);
  return raw ? JSON.parse(raw) : [];
}

async function addComment(env, id, name, text, userId) {
  const list = await getComments(env, id);
  const cid = crypto.randomUUID();
  list.unshift({ id: cid, name, text, userId, time: new Date().toISOString() });
  await env.VIDEOS.put("comments:" + id, JSON.stringify(list));
  return list;
}

async function deleteComment(env, videoId, commentId) {
  let list = await getComments(env, videoId);
  list = list.filter(c => c.id !== commentId);
  await env.VIDEOS.put("comments:" + videoId, JSON.stringify(list));
}

async function editComment(env, videoId, commentId, newText) {
  let list = await getComments(env, videoId);
  const idx = list.findIndex(c => c.id === commentId);
  if (idx !== -1) list[idx].text = newText;
  await env.VIDEOS.put("comments:" + videoId, JSON.stringify(list));
}

// ─── Categories (with sub-categories) ───────────────────────────────────────

async function getCategories(env) {
  const raw = await env.VIDEOS.get("categories_v2");
  if (raw) return JSON.parse(raw);
  const oldRaw = await env.VIDEOS.get("categories");
  const oldCats = oldRaw ? JSON.parse(oldRaw) : ["All"];
  const cats = oldCats.filter(c => c !== "All").map(name => ({ name, subs: [] }));
  return cats;
}

async function saveCategories(env, cats) {
  await env.VIDEOS.put("categories_v2", JSON.stringify(cats));
}

// ─── Series (multi-part video packs) ─────────────────────────────────────────

async function getSeriesList(env) {
  const raw = await env.VIDEOS.get("series_list");
  return raw ? JSON.parse(raw) : [];
}
async function saveSeriesList(env, list) {
  await env.VIDEOS.put("series_list", JSON.stringify(list));
}
async function getSeriesById(env, id) {
  const list = await getSeriesList(env);
  return list.find(s => s.id === id) || null;
}
// Sorts videos/parts into their display order for a series. Uses the explicit
// admin-settable `partOrder` field when a part has one (so admin can move
// "Part 3" to "Part 1" without touching upload time); parts without a
// partOrder (old data, or new parts nobody has reordered yet) fall back to
// upload time, oldest first — same behavior as before partOrder existed, so
// old series keep working unmodified. Parts with an explicit partOrder always
// sort ahead of parts without one, at the position their number implies.
function sortByUploadOrder(list) {
  return [...list].sort((a, b) => {
    const aHas = typeof a.partOrder === "number";
    const bHas = typeof b.partOrder === "number";
    if (aHas && bHas) return a.partOrder - b.partOrder;
    if (aHas !== bHas) {
      // Mixed old/new data: compare the explicit number against the other's
      // upload-order rank isn't meaningful across types, so just keep
      // ordered parts first in their given order, unordered after, oldest
      // upload first among the unordered ones (matches old fallback).
      return aHas ? -1 : 1;
    }
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

// ─── Users list ──────────────────────────────────────────────────────────────

async function getAllUsers(env) {
  const raw = await env.VIDEOS.get("all_users");
  return raw ? JSON.parse(raw) : [];
}

// Merges each summary entry (from the all_users index) with its full stored
// record, so the admin panel can show details the lightweight index doesn't
// carry (password hash, IPs, ban reason, timestamps, etc).
async function enrichUsers(env, users) {
  return Promise.all(users.map(async (u) => {
    const full = await getUser(env, u.email);
    return full ? { ...u, ...full } : u;
  }));
}

// "Online" = a heartbeat (sent every 15s while a tab is visible, see
// liveUpdateScript) within the last 45s. Used by both the admin Analytics
// tab (per-user) and the site-wide "live viewers" counter.
const ONLINE_WINDOW_MS = 45 * 1000;
async function getOnlineCount(env) {
  const users = await getAllUsers(env);
  if (!users.length) return { online: 0, usernames: [] };
  const enriched = await enrichUsers(env, users);
  const now = Date.now();
  const onlineUsers = enriched.filter(u => u.lastSeen && (now - u.lastSeen) < ONLINE_WINDOW_MS);
  return { online: onlineUsers.length, usernames: onlineUsers.slice(0, 20).map(u => u.username) };
}

// ── Anonymous / guest visitor presence (Admin Analytics) ───────────────────
// Uses KV expirationTtl instead of a manually-pruned list: a presence key
// simply stops existing once a visitor's heartbeat window elapses, so
// "online now" is always just "how many anon_presence:* keys exist right
// now" with zero cleanup/cron logic required. A stable, cookie-issued
// visitor id (not the IP) is the dedup key, so refreshing/re-heartbeating
// from the same browser never inflates the count.
const ANON_PRESENCE_TTL_SECONDS = 60; // heartbeat sent every 20s client-side (see guestHeartbeatScript)
const ANON_VISIT_DEDUP_TTL_SECONDS = 24 * 60 * 60;

function getVisitorIdFromCookie(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)vid=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function visitorCookieHeader(vid) {
  // Not HttpOnly: nothing sensitive lives in it (just a random dedup token),
  // and it doesn't need to be — but it IS Secure/SameSite to avoid casual
  // tampering/leakage. 1 year lifetime just keeps returning-guest counts
  // stable; actual "online" presence is entirely driven by the short TTL
  // KV key above, not by cookie age.
  return `vid=${encodeURIComponent(vid)}; Path=/; Secure; SameSite=Lax; Max-Age=31536000`;
}

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function recordAnonymousPresence(env, vid) {
  if (!vid) return;
  await env.VIDEOS.put("anon_presence:" + vid, String(Date.now()), { expirationTtl: ANON_PRESENCE_TTL_SECONDS });
  const dedupKey = "anon_seen:" + todayKeyUTC() + ":" + vid;
  const already = await env.VIDEOS.get(dedupKey);
  if (!already) {
    await env.VIDEOS.put(dedupKey, "1", { expirationTtl: ANON_VISIT_DEDUP_TTL_SECONDS });
    const totalKey = "anon_visits_total:" + todayKeyUTC();
    const current = Number(await env.VIDEOS.get(totalKey)) || 0;
    await env.VIDEOS.put(totalKey, String(current + 1), { expirationTtl: ANON_VISIT_DEDUP_TTL_SECONDS });
  }
}

async function recordRegisteredVisit(env, email) {
  const dedupKey = "reg_seen:" + todayKeyUTC() + ":" + email;
  const already = await env.VIDEOS.get(dedupKey);
  if (!already) {
    await env.VIDEOS.put(dedupKey, "1", { expirationTtl: ANON_VISIT_DEDUP_TTL_SECONDS });
    const totalKey = "reg_visits_total:" + todayKeyUTC();
    const current = Number(await env.VIDEOS.get(totalKey)) || 0;
    await env.VIDEOS.put(totalKey, String(current + 1), { expirationTtl: ANON_VISIT_DEDUP_TTL_SECONDS });
  }
}

// Counts live anon_presence:* keys. KV list() is eventually consistent and
// paginated, but presence counts are inherently approximate/real-time-ish
// by nature (same tradeoff the registered "online now" counter already
// makes), and this stays cheap since stale keys expire themselves.
async function getAnonymousOnlineCount(env) {
  let count = 0;
  let cursor = undefined;
  do {
    const page = await env.VIDEOS.list({ prefix: "anon_presence:", cursor, limit: 1000 });
    count += page.keys.length;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return count;
}

async function getAnalyticsSnapshot(env) {
  const [liveViewers, anonOnline, anonVisitsToday, regVisitsToday] = await Promise.all([
    getOnlineCount(env),
    getAnonymousOnlineCount(env),
    env.VIDEOS.get("anon_visits_total:" + todayKeyUTC()),
    env.VIDEOS.get("reg_visits_total:" + todayKeyUTC())
  ]);
  return {
    registeredOnline: liveViewers.online,
    anonymousOnline: anonOnline,
    totalOnline: liveViewers.online + anonOnline,
    registeredVisitsToday: Number(regVisitsToday) || 0,
    anonymousVisitsToday: Number(anonVisitsToday) || 0,
    updatedAt: Date.now()
  };
}

async function buildAdminCookie(env) {
  const exp = Date.now() + 12 * 60 * 60 * 1000; // 12h admin session
  const sig = await hmacHex(env.LINK_SECRET, `admin:${exp}`);
  const value = encodeURIComponent(`${exp}.${sig}`);
  return `admin_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`;
}

function clearAdminCookie() {
  return `admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Every /admin* page and /api/admin/* endpoint is gated behind this,
// independent of the regular user `session` cookie — the app previously had
// NO server-side check on any admin route (any visitor who guessed the URL
// could reach the full admin panel and every /admin/* POST action). This is
// a separate, short-lived, HMAC-signed cookie tied to a single shared
// ADMIN_PASSWORD secret (env.ADMIN_PASSWORD) rather than to any one user
// account, since the existing user model has no admin-role field to hook
// into safely.
async function isAdminAuthed(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (!match) return false;
  const raw = decodeURIComponent(match[1]);
  const dot = raw.lastIndexOf(".");
  if (dot === -1) return false;
  const exp = Number(raw.slice(0, dot));
  const sig = raw.slice(dot + 1);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = await hmacHex(env.LINK_SECRET, `admin:${exp}`);
  return expected === sig;
}

async function updateUsersList(env, users) {
  await env.VIDEOS.put("all_users", JSON.stringify(users));
}

async function deleteUserFully(env, email) {
  const lc = email.toLowerCase();
  const user = await getUser(env, lc);
  if (user) {
    await env.VIDEOS.delete("user:" + lc);
    await env.VIDEOS.delete("user_username:" + user.username.toLowerCase());
  }
  let users = await getAllUsers(env);
  users = users.filter(u => u.email !== lc);
  await updateUsersList(env, users);
}

// ─── Friend system ────────────────────────────────────────────────────────
// Friendships are stored bidirectionally: "friends:<email>" holds this
// user's friend list (denormalized with username/name for fast rendering).
// Requests are stored on both sides too: "friendreq_in:<email>" for the
// recipient, "friendreq_out:<email>" for the sender, so each side can render
// without extra lookups (same pattern as coin requests elsewhere in this file).

async function getFriends(env, email) {
  const raw = await env.VIDEOS.get("friends:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function saveFriends(env, email, list) {
  await env.VIDEOS.put("friends:" + email.toLowerCase(), JSON.stringify(list));
}
async function getFriendRequestsIn(env, email) {
  const raw = await env.VIDEOS.get("friendreq_in:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function getFriendRequestsOut(env, email) {
  const raw = await env.VIDEOS.get("friendreq_out:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function areFriends(env, emailA, emailB) {
  const list = await getFriends(env, emailA);
  return list.some(f => f.email === emailB.toLowerCase());
}
// Removes emailToRemove from emailOwner's friend list (one side only —
// caller is expected to call this twice, once per direction, for a full
// unfriend/reset).
async function removeFriendOneSide(env, emailOwner, emailToRemove) {
  const list = await getFriends(env, emailOwner);
  const next = list.filter(f => f.email !== emailToRemove.toLowerCase());
  if (next.length !== list.length) await saveFriends(env, emailOwner, next);
}
// Removes a pending request referencing `otherEmail` from emailOwner's
// "in" or "out" list (direction relative to emailOwner).
async function removeFriendRequestOneSide(env, emailOwner, otherEmail, direction) {
  const prefix = direction === "in" ? "friendreq_in:" : "friendreq_out:";
  const raw = await env.VIDEOS.get(prefix + emailOwner.toLowerCase());
  const list = raw ? JSON.parse(raw) : [];
  const field = direction === "in" ? "fromEmail" : "toEmail";
  const next = list.filter(r => r[field] !== otherEmail.toLowerCase());
  if (next.length !== list.length) await env.VIDEOS.put(prefix + emailOwner.toLowerCase(), JSON.stringify(next));
}
// Friend-button state for `viewer` looking at `target`'s profile.
async function friendStatusBetween(env, viewerEmail, targetEmail) {
  if (viewerEmail.toLowerCase() === targetEmail.toLowerCase()) return "self";
  if (await areFriends(env, viewerEmail, targetEmail)) return "friends";
  const outgoing = await getFriendRequestsOut(env, viewerEmail);
  if (outgoing.some(r => r.toEmail === targetEmail.toLowerCase())) return "request_sent";
  const incoming = await getFriendRequestsIn(env, viewerEmail);
  if (incoming.some(r => r.fromEmail === targetEmail.toLowerCase())) return "request_incoming";
  return "none";
}
async function sendFriendRequest(env, fromUser, toUser) {
  if (fromUser.email === toUser.email) return { error: "You can't add yourself as a friend" };
  if (await areFriends(env, fromUser.email, toUser.email)) return { error: "Already friends" };
  const outgoing = await getFriendRequestsOut(env, fromUser.email);
  if (outgoing.some(r => r.toEmail === toUser.email)) return { error: "Request already sent" };
  const incoming = await getFriendRequestsIn(env, fromUser.email);
  if (incoming.some(r => r.fromEmail === toUser.email)) return { error: "This user already sent you a request — check your Requests tab" };
  const rec = { id: crypto.randomUUID(), fromEmail: fromUser.email, fromUsername: fromUser.username, toEmail: toUser.email, toUsername: toUser.username, createdAt: Date.now() };
  const inList = await getFriendRequestsIn(env, toUser.email);
  inList.unshift(rec);
  await env.VIDEOS.put("friendreq_in:" + toUser.email.toLowerCase(), JSON.stringify(inList.slice(0, 200)));
  const outList = await getFriendRequestsOut(env, fromUser.email);
  outList.unshift(rec);
  await env.VIDEOS.put("friendreq_out:" + fromUser.email.toLowerCase(), JSON.stringify(outList.slice(0, 200)));
  await addNotification(env, toUser.email, `👥 @${fromUser.username} wants to be your friend.`, { type: "friend_request", actionUrl: "/friends?tab=requests" });
  return { success: true };
}
async function cancelFriendRequest(env, fromEmail, toEmail) {
  await removeFriendRequestOneSide(env, fromEmail, toEmail, "out");
  await removeFriendRequestOneSide(env, toEmail, fromEmail, "in");
}
async function acceptFriendRequest(env, toUser, fromEmail) {
  // toUser is accepting; fromEmail is the original sender.
  const incoming = await getFriendRequestsIn(env, toUser.email);
  const req = incoming.find(r => r.fromEmail === fromEmail.toLowerCase());
  if (!req) return { error: "Request not found" };
  await removeFriendRequestOneSide(env, toUser.email, fromEmail, "in");
  await removeFriendRequestOneSide(env, fromEmail, toUser.email, "out");
  if (await areFriends(env, toUser.email, fromEmail)) return { success: true }; // idempotent guard vs double-accept race
  const fromUser = await getUser(env, fromEmail);
  if (!fromUser) return { error: "User not found" };
  const aList = await getFriends(env, toUser.email);
  aList.unshift({ email: fromUser.email, username: fromUser.username });
  await saveFriends(env, toUser.email, aList);
  const bList = await getFriends(env, fromUser.email);
  bList.unshift({ email: toUser.email, username: toUser.username });
  await saveFriends(env, fromUser.email, bList);
  await addNotification(env, fromUser.email, `✓ @${toUser.username} accepted your friend request.`, { type: "friend_accepted", actionUrl: "/user/" + toUser.username });
  return { success: true };
}
async function declineFriendRequest(env, toEmail, fromEmail) {
  await removeFriendRequestOneSide(env, toEmail, fromEmail, "in");
  await removeFriendRequestOneSide(env, fromEmail, toEmail, "out");
}
async function removeFriend(env, emailA, emailB) {
  await removeFriendOneSide(env, emailA, emailB);
  await removeFriendOneSide(env, emailB, emailA);
}

// ─── Complete Account Reset ──────────────────────────────────────────────
// Resets a user's account to a fresh-signup state WITHOUT deleting the
// account. Preserves identity (email, username, password/provider,
// createdAt). Clears everything else: coins, purchases, downloads, watch
// history, favorites/likes/dislikes, ratings/comments ownership markers,
// friends, friend requests, gifts, coin requests, notifications, check-in
// streak, active-time progress. Bumps localResetToken so the user's browser
// clears its localStorage (watch later, saved playback positions, device id)
// on its next /api/balance poll — reusing the exact mechanism already used
// by the per-user "Reset local data" admin action.
async function completeAccountReset(env, email, adminName) {
  const lc = email.toLowerCase();
  const user = await getUser(env, lc);
  if (!user) return { success: false, error: "User not found" };

  const settings = await getSettings(env);

  // Cancel any outstanding reversible gifts this user sent, without moving
  // coins — the balance is about to be wiped anyway, and letting these stay
  // "reversible" after reset (against a since-reset sender) is exactly the
  // exploit path Part 19 warns about. We mark them terminally instead.
  const sentGiftIds = await getSentGifts(env, lc);
  for (const giftId of sentGiftIds) {
    const gift = await getGift(env, giftId);
    if (gift && gift.status === "completed") {
      gift.status = "reversed";
      gift.reversedAt = Date.now();
      gift.reverseReason = "Cancelled by Complete Account Reset (no coins moved)";
      await saveGift(env, gift);
    }
  }

  // Friends: remove the relationship from both sides.
  const friends = await getFriends(env, lc);
  for (const f of friends) {
    await removeFriendOneSide(env, f.email, lc);
  }
  // Pending requests either direction: drop them from the other party's lists too.
  const incoming = await getFriendRequestsIn(env, lc);
  for (const r of incoming) await removeFriendRequestOneSide(env, r.fromEmail, lc, "out");
  const outgoing = await getFriendRequestsOut(env, lc);
  for (const r of outgoing) await removeFriendRequestOneSide(env, r.toEmail, lc, "in");

  // Wipe this user's own KV-stored activity data.
  await Promise.all([
    env.VIDEOS.delete("purchases:" + lc),
    env.VIDEOS.delete("downloads:" + lc),
    env.VIDEOS.delete("coinhistory:" + lc),
    env.VIDEOS.delete("notifications:" + lc),
    env.VIDEOS.delete("history:" + lc),
    env.VIDEOS.delete("giftsent:" + lc),
    env.VIDEOS.delete("coinreq_in:" + lc),
    env.VIDEOS.delete("coinreq_out:" + lc),
    env.VIDEOS.delete("friends:" + lc),
    env.VIDEOS.delete("friendreq_in:" + lc),
    env.VIDEOS.delete("friendreq_out:" + lc)
  ]);

  // Reset the user record itself back to fresh-signup values, preserving identity.
  user.coins = settings.newUserStartingCoins || 0;
  user.totalEarned = 0;
  user.checkinStreak = 0;
  user.lastCheckinDate = null;
  user.totalStayMinutes = 0;
  user.referralCount = user.referralCount; // referral relationships to others are left intact (not this user's "own" activity)
  user.localResetToken = (user.localResetToken || 0) + 1; // triggers client-side localStorage clear
  await saveUser(env, user);

  let usersList = await getAllUsers(env);
  const idx = usersList.findIndex(u => u.email === lc);
  if (idx !== -1) { usersList[idx].coins = user.coins; await updateUsersList(env, usersList); }

  await addAdminAuditLog(env, adminName || "admin", "COMPLETE_ACCOUNT_RESET", user.username, `email=${lc}`);
  await addTransactionLog(env, { type: "account_reset", from: null, to: user.username, amount: 0, status: "completed", note: "Complete Account Reset by admin" });

  return { success: true };
}

// ─── Crypto ──────────────────────────────────────────────────────────────────

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(env, password, email) {
  return hmacHex(env.LINK_SECRET, `${email.toLowerCase()}:${password}`);
}

async function buildSignedSrc(driveProxyBase, driveId, secret) {
  const exp = Date.now() + 6 * 60 * 60 * 1000;
  const sig = await hmacHex(secret, `${driveId}:${exp}`);
  return `${driveProxyBase}/?id=${encodeURIComponent(driveId)}&exp=${exp}&sig=${sig}`;
}

// Downloads get their own, much shorter-lived signed URL (vs. the 6h
// streaming link above) — it's meant to be used immediately by the browser
// to start one download, not kept around, so a short window limits how long
// a leaked/shared link stays valid.
async function buildSignedDownloadSrc(driveProxyBase, driveId, secret) {
  const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
  const sig = await hmacHex(secret, `${driveId}:${exp}`);
  return `${driveProxyBase}/?id=${encodeURIComponent(driveId)}&exp=${exp}&sig=${sig}`;
}

async function makeSessionCookie(env, user) {
  const payload = JSON.stringify({ email: user.email, username: user.username, name: user.name, coins: user.coins, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const b64 = btoa(unescape(encodeURIComponent(payload)));
  const sig = await hmacHex(env.LINK_SECRET, b64);
  const value = encodeURIComponent(`${b64}.${sig}`);
  return `session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

function clearSessionCookie() {
  return `session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function getSession(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;
  const raw = decodeURIComponent(match[1]);
  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;
  const b64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = await hmacHex(env.LINK_SECRET, b64);
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch (e) { return null; }
}

// ─── Ads ─────────────────────────────────────────────────────────────────────
// Ads are stored as a list under "ads_list". For backward compatibility with
// the original single `ad_code` KV key, getAds() migrates that legacy value
// into a list entry (once) the first time it's read, so the existing ad is
// never lost and no manual admin action is required.

const AD_PLACEMENTS = ["home", "watch", "movie_detail", "category", "footer"];

async function getAds(env) {
  const raw = await env.VIDEOS.get("ads_list");
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through to legacy migration */ }
  }
  // No ads_list yet — migrate legacy single ad_code if present.
  const legacy = await env.VIDEOS.get("ad_code");
  if (legacy && legacy.trim()) {
    const migrated = [{
      id: crypto.randomUUID(),
      name: "Existing Ad",
      type: "html",
      code: legacy,
      placement: "home",
      status: "active",
      priority: 0,
      startDate: null,
      endDate: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }];
    await env.VIDEOS.put("ads_list", JSON.stringify(migrated));
    return migrated;
  }
  return [];
}
async function saveAds(env, list) {
  await env.VIDEOS.put("ads_list", JSON.stringify(list));
}
// Returns the best active ad for a given placement (highest priority first,
// respecting optional start/end dates), falling back to the legacy single
// getAdCode()-style banner if nothing is configured for that placement.
async function getAdForPlacement(env, placement) {
  const ads = await getAds(env);
  const now = Date.now();
  const eligible = ads.filter(a =>
    a.status === "active" &&
    (a.placement === placement || (!a.placement && placement === "home")) &&
    (!a.startDate || new Date(a.startDate).getTime() <= now) &&
    (!a.endDate || new Date(a.endDate).getTime() >= now)
  ).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return eligible[0] || null;
}
// Legacy helper retained for any remaining direct callers — returns the code
// of the top ad for the "home" placement (or empty string).
async function getAdCode(env) {
  const ad = await getAdForPlacement(env, "home");
  return ad ? ad.code : "";
}

function adBanner(adCodeOrAd) {
  const code = typeof adCodeOrAd === "string" ? adCodeOrAd : (adCodeOrAd ? adCodeOrAd.code : "");
  return `<div class="ad-banner">${code ? code : `<div class="ad-space">Your Ad Here (728×90)</div>`}</div>`;
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

function isSpam(text) {
  if (/https?:\/\/|www\.|\.com|\.net|\.io/i.test(text)) return true;
  if (/(.)\1{4,}/.test(text)) return true;
  if (/^[A-Z0-9\s!]{15,}$/m.test(text)) return true;
  if (/@/.test(text)) return true;
  return false;
}

// Formats a stored "YYYY-MM-DD" releaseDate for display (NEW — Feature: Release Date).
// Parsed with an explicit T00:00:00 so it's read as local, not shifted a day by UTC parsing.
function formatReleaseDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch (e) { return ""; }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// Robust, locale-independent release-date parsing for sorting. Returns a
// numeric timestamp for a valid date, or null for missing/malformed values
// (e.g. a typo'd "2026-13-40") so callers can safely push those to the end
// instead of crashing or sorting them unpredictably.
function getReleaseTimestamp(dateStr) {
  if (!dateStr) return null;
  const ts = Date.parse(dateStr);
  return Number.isFinite(ts) ? ts : null;
}

function renderStars(avg) {
  const full = Math.round(avg);
  let out = "";
  for (let i = 1; i <= 5; i++) out += i <= full ? "★" : "☆";
  return out;
}

// Formats large counts YouTube-style: 999 -> "999", 1500 -> "1.5K",
// 12000 -> "12K", 1200000 -> "1.2M", 15000000 -> "15M", etc.
function formatCount(n) {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  const tiers = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [v, suffix] of tiers) {
    if (n >= v) {
      const num = n / v;
      const decimals = num < 10 ? 1 : 0;
      const str = num.toFixed(decimals).replace(/\.0$/, "");
      return str + suffix;
    }
  }
  return String(n);
}

// ─── Pages ───────────────────────────────────────────────────────────────────

// Shown for any visitor without a valid session instead of site content.
// The whole browsing experience is gated behind login/signup.
function loggedOutGatePage() {
  const body = `
    <header>
      <div class="wordmark">TAMIZH<span>ZORA</span></div>
      <div class="user-menu">${themeToggleBtn()}</div>
    </header>
    <div class="perf"></div>
    <div class="gate-wrap">
      <div class="gate-icon">🔒</div>
      <h2>Login to enjoy</h2>
      <p>Sign in to watch videos, earn coins, and unlock premium content. Don't have an account? Sign up — it's free and comes with 50 coins to get started.</p>
      <div class="gate-actions">
        <a class="purchase-btn" href="/login">Log in</a>
        <a class="purchase-btn secondary" href="/signup">Sign up</a>
      </div>
    </div>`;
  return shell("Login to enjoy", body);
}

async function homePage(videos, env, sort, q, category, subCategory, session, request, priceFilter, maxCoins, previewMode) {
  // Home is public: guests/logged-out visitors browse the full catalog just
  // like logged-in users. Only actual video playback (and other account
  // features) require login — enforced later, at /watch and the account
  // routes. (loggedOutGatePage() is left defined below, unused, in case a
  // full site gate is ever wanted again.)

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const settings = await getBranding(env); // superset of getSettings(): also carries resolved siteLogoHref/faviconHref
  const freeMode = isFreeMode(settings);
  const published = videos.filter(isPublished);
  const viewsData = await Promise.all(published.map((v) => getViews(env, v.id)));
  const likesData = await Promise.all(published.map((v) => getLikes(env, v.id)));
  const dislikesData = await Promise.all(published.map((v) => getDislikes(env, v.id)));
  const ratingsData = await Promise.all(published.map((v) => getRatings(env, v.id)));
  const purchaseCounts = sort === "purchased" ? await Promise.all(published.map((v) => getPurchaseCount(env, v.id))) : [];

  let list = published.map((v, i) => ({
    ...v,
    views: viewsData[i].count,
    likes: likesData[i],
    dislikes: dislikesData[i],
    ratingSummary: ratingsSummary(ratingsData[i]),
    purchaseCount: purchaseCounts[i] || 0
  }));

  const cats = await getCategories(env);
  const seriesList = await getSeriesList(env);
  const seriesById = Object.fromEntries(seriesList.map(s => [s.id, s]));

  // Category show/hide: admin can hide a whole category from users; its
  // videos disappear from the browse grid and its tab drops off the nav.
  const hiddenCatNames = new Set(cats.filter(c => c.hidden).map(c => c.name));
  if (hiddenCatNames.size) list = list.filter(v => !hiddenCatNames.has(v.category));

  // Series "playlist" mode: the home grid only ever shows one card per
  // series — its first UPLOADED part (earliest createdAt), not necessarily
  // the lowest admin-entered part number — instead of every individual
  // part. Computed from the full published set (not the filtered/sorted
  // `list`) so it's always genuinely the first upload, regardless of
  // category/search/sort filters. A series that's been trashed by the
  // admin is treated as if its videos were never grouped.
  const seriesFirstPartId = {};
  const seriesPartCounts = {};
  const seriesLatestReleaseDate = {}; // newest VALID releaseDate string across all parts of a
  // series, so the series card sorts by its most recently released episode, not just
  // whichever part happens to be the representative (first-uploaded) card.
  const seriesLatestReleaseTs = {};   // parallel numeric timestamp, used for comparisons
  for (const v of published) {
    if (!v.seriesId) continue;
    const s = seriesById[v.seriesId];
    if (!s || s.deleted) continue;
    seriesPartCounts[v.seriesId] = (seriesPartCounts[v.seriesId] || 0) + 1;
    const t = v.createdAt || 0;
    if (!(v.seriesId in seriesFirstPartId) || t < seriesFirstPartId[v.seriesId].createdAt) {
      seriesFirstPartId[v.seriesId] = { id: v.id, createdAt: t };
    }
    // Skip parts with a missing/malformed releaseDate entirely rather than
    // letting an invalid value win a string comparison or blank out a
    // series' otherwise-valid latest release date.
    const partTs = getReleaseTimestamp(v.releaseDate);
    if (partTs !== null && (!(v.seriesId in seriesLatestReleaseTs) || partTs > seriesLatestReleaseTs[v.seriesId])) {
      seriesLatestReleaseTs[v.seriesId] = partTs;
      seriesLatestReleaseDate[v.seriesId] = v.releaseDate;
    }
  }
  list = list.filter(v => {
    if (!v.seriesId) return true;
    const s = seriesById[v.seriesId];
    if (!s || s.deleted) return true; // series trashed — show every part standalone
    return !seriesFirstPartId[v.seriesId] || seriesFirstPartId[v.seriesId].id === v.id;
  });
  // Give the representative series card an "effective" release date — the latest
  // valid release date across all of that series' parts — so catalog ordering
  // reflects the newest episode, not just whichever part happens to be Part 1.
  // Standalone movies just use their own releaseDate. effectiveReleaseTs is the
  // pre-validated numeric form sortByRelease actually compares on; a movie/series
  // with no valid release date gets effectiveReleaseDate/Ts === null and sorts
  // after every dated item (see sortByRelease below), falling back to createdAt.
  list = list.map(v => {
    if (v.seriesId && v.seriesId in seriesLatestReleaseTs) {
      return { ...v, effectiveReleaseDate: seriesLatestReleaseDate[v.seriesId], effectiveReleaseTs: seriesLatestReleaseTs[v.seriesId] };
    }
    const ts = getReleaseTimestamp(v.releaseDate);
    return { ...v, effectiveReleaseDate: ts !== null ? v.releaseDate : null, effectiveReleaseTs: ts };
  });

  // Hidden series (NEW — Feature: Series Hide/Unhide): a series the admin has
  // hidden must not appear anywhere in browsing, unlike a trashed series
  // (which falls back to showing its parts standalone). "Do not expose
  // hidden content" — so these are dropped outright, not ungrouped.
  const hiddenSeriesIds = new Set(seriesList.filter(s => s.hidden).map(s => s.id));
  if (hiddenSeriesIds.size) list = list.filter(v => !(v.seriesId && hiddenSeriesIds.has(v.seriesId)));

  // ── Years navigation (automatic year categorization) ──────────────────────
  // Derived purely from each item's effectiveReleaseTs (single source of truth,
  // see getReleaseTimestamp/sortByRelease above) — never a separately stored
  // category, so there's nothing to migrate/duplicate and editing a movie's
  // releaseDate immediately moves it between years on the next render.
  const yearsAvailable = [...new Set(
    list.filter(v => v.effectiveReleaseTs !== null).map(v => new Date(v.effectiveReleaseTs).getFullYear())
  )].sort((a, b) => b - a); // newest → oldest

  const isYearsView = category === "__years__";
  const selectedYear = isYearsView && subCategory && /^\d{4}$/.test(subCategory) ? Number(subCategory) : null;

  if (isYearsView) {
    if (selectedYear !== null) {
      list = list.filter(v => v.effectiveReleaseTs !== null && new Date(v.effectiveReleaseTs).getFullYear() === selectedYear);
    }
    // With no specific year chosen, "Years" shows the full dated catalog
    // (still sorted newest release → oldest below) so the tab isn't empty.
  } else if (category && category !== "All") {
    list = list.filter((v) => v.category === category);
    if (subCategory) list = list.filter((v) => v.subCategory === subCategory);
  }
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((v) => v.title.toLowerCase().includes(needle) || (v.description || "").toLowerCase().includes(needle));
  }
  if (priceFilter === "free") list = list.filter(v => !v.coinCost || v.coinCost === 0);
  else if (priceFilter === "under") list = list.filter(v => v.coinCost > 0 && v.coinCost <= (maxCoins || 20));
  else if (priceFilter === "premium") list = list.filter(v => v.coinCost > 0);

  // Release-date sort: newest valid release date first; movies/series with no
  // valid release date sort after every dated item, then fall back to
  // createdAt (upload order) for a deterministic order among themselves, and
  // finally to id as a last-resort tiebreaker so ties never reorder randomly
  // across requests/deploys.
  const sortByRelease = (arr) => arr.sort((a, b) => {
    if (a.effectiveReleaseTs !== null && b.effectiveReleaseTs !== null) {
      if (a.effectiveReleaseTs !== b.effectiveReleaseTs) return b.effectiveReleaseTs - a.effectiveReleaseTs;
    } else if (a.effectiveReleaseTs !== null) return -1;
    else if (b.effectiveReleaseTs !== null) return 1;
    const ca = a.createdAt || 0, cb = b.createdAt || 0;
    if (ca !== cb) return cb - ca;
    return String(a.id).localeCompare(String(b.id));
  });

  // "newest" (recently added / upload order) is an explicit, separate sort
  // from the default release-date ordering — it must not silently mean the
  // same thing, since createdAt and releaseDate can differ a lot (e.g. an
  // old upload re-released today, or a new upload backdated to an old
  // release). Default (no/unknown `sort` value) is release-date descending.
  if (sort === "views") list.sort((a, b) => b.views - a.views);
  else if (sort === "purchased") list.sort((a, b) => b.purchaseCount - a.purchaseCount);
  else if (sort === "newest") list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // explicit "recently added" — upload order
  else sortByRelease(list); // DEFAULT and sort=release: newest release date → oldest, dated items first

  const prefetchSrcs = session
    ? await Promise.all(list.map((v) => buildSignedSrc(env.DRIVE_PROXY_BASE, v.driveId, env.LINK_SECRET)))
    : list.map(() => "");

  const purchasedSet = session ? new Set(await getPurchases(env, session.email)) : new Set();

  // Homepage split: standalone videos and series are rendered as two
  // separate sections/grids instead of one mixed grid.
  const videoCardsArr = [];
  const seriesCardsArr = [];
  list.forEach((v, i) => {
    const sRaw = v.seriesId ? seriesById[v.seriesId] : null;
    const s = sRaw && !sRaw.deleted ? sRaw : null;
    const showCost = !freeMode && v.coinCost > 0;
    const html = `
    <a class="card" href="/watch?id=${encodeURIComponent(v.id)}" ${session ? `data-prefetch="${escapeHtml(prefetchSrcs[i])}" onmouseenter="prefetchVideo(this)" ontouchstart="prefetchVideo(this)"` : ""}>
      <div class="thumb-wrap">
        <img class="thumb" src="${escapeHtml(v.thumbnail)}" loading="lazy" alt="">
        ${showCost ? `<div class="coin-cost-badge">💰${v.coinCost}</div>` : (v.coinCost > 0 && freeMode ? `<div class="coin-cost-badge">Free</div>` : "")}
        ${showCost && (purchasedSet.has(v.id) || (s && purchasedSet.has("series:" + s.id))) ? `<div class="claimed-badge">✓ Claimed</div>` : ""}
        ${v.duration ? `<div class="duration-badge">${escapeHtml(v.duration)}</div>` : ""}
        ${s ? `<div class="series-badge">📺 Series · ${seriesPartCounts[v.seriesId] || 1} part${(seriesPartCounts[v.seriesId] || 1) === 1 ? "" : "s"}</div>` : ""}
      </div>
      <div class="card-title">${escapeHtml(v.title)}</div>
      <div class="card-meta">
        <span>${formatCount(v.views)} view${v.views === 1 ? "" : "s"}</span>
        <div class="likes-dislikes"><span>❤️ ${formatCount(v.likes)}</span><span>👎 ${formatCount(v.dislikes)}</span></div>
      </div>
      ${v.ratingSummary.count ? `<div class="card-rating"><span class="stars">${renderStars(v.ratingSummary.avg)}</span> ${v.ratingSummary.avg} <span class="card-rating-count">(${formatCount(v.ratingSummary.count)})</span></div>` : ""}
      ${settings.showReleaseDate && v.effectiveReleaseDate ? `<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">📅 Released: ${escapeHtml(formatReleaseDate(v.effectiveReleaseDate))}</div>` : ""}
    </a>`;
    if (s) seriesCardsArr.push(html); else videoCardsArr.push(html);
  });
  const videoCards = videoCardsArr.join("");
  const seriesCards = seriesCardsArr.join("");

  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
  const catParam = category && category !== "All" ? `&category=${encodeURIComponent(category)}` : "";
  const priceParam = priceFilter ? `&price=${encodeURIComponent(priceFilter)}` : "";

  const selectedCat = cats.find(c => c.name === category);
  const visibleCats = cats.filter(c => !c.hidden);
  const yearsCatParam = `&category=${encodeURIComponent("__years__")}`;
  const catMenu = (visibleCats.length || yearsAvailable.length) ? `
    <nav class="cat-menu-bar">
      <a class="cat-menu-item ${!category || category === "All" ? "active" : ""}" href="/?sort=${sort}${qParam}${priceParam}">All</a>
      ${visibleCats.map(c => `<a class="cat-menu-item ${category === c.name ? "active" : ""}" href="/?sort=${sort}&category=${encodeURIComponent(c.name)}${qParam}${priceParam}">${escapeHtml(c.name)}</a>`).join("")}
      ${yearsAvailable.length ? `<a class="cat-menu-item ${isYearsView ? "active" : ""}" href="/?sort=${sort}${yearsCatParam}${qParam}${priceParam}">Years</a>` : ""}
    </nav>
    ${selectedCat && !selectedCat.hidden && selectedCat.subs && selectedCat.subs.length ? `
    <nav class="cat-submenu-bar">
      <a class="cat-submenu-item ${!subCategory ? "active" : ""}" href="/?sort=${sort}${catParam}${qParam}${priceParam}">All ${escapeHtml(selectedCat.name)}</a>
      ${selectedCat.subs.map(s => `<a class="cat-submenu-item ${subCategory === s ? "active" : ""}" href="/?sort=${sort}${catParam}&sub=${encodeURIComponent(s)}${qParam}${priceParam}">${escapeHtml(s)}</a>`).join("")}
    </nav>` : ""}
    ${isYearsView && yearsAvailable.length ? `
    <nav class="cat-submenu-bar">
      <a class="cat-submenu-item ${selectedYear === null ? "active" : ""}" href="/?sort=${sort}${yearsCatParam}${qParam}${priceParam}">All Years</a>
      ${yearsAvailable.map(y => `<a class="cat-submenu-item ${selectedYear === y ? "active" : ""}" href="/?sort=${sort}${yearsCatParam}&sub=${y}${qParam}${priceParam}">${y}</a>`).join("")}
    </nav>` : ""}
  ` : "";

  const priceFilters = freeMode ? "" : `
    <div class="price-filters">
      <a class="price-filter ${!priceFilter ? "active" : ""}" href="/?sort=${sort}${catParam}${qParam}">Any price</a>
      <a class="price-filter ${priceFilter === "free" ? "active" : ""}" href="/?sort=${sort}${catParam}${qParam}&price=free">Free</a>
      <a class="price-filter ${priceFilter === "under" ? "active" : ""}" href="/?sort=${sort}${catParam}${qParam}&price=under&max=20">Under 20 coins</a>
      <a class="price-filter ${priceFilter === "premium" ? "active" : ""}" href="/?sort=${sort}${catParam}${qParam}&price=premium">Premium</a>
    </div>`;

  const userArea = session
    ? `<div class="user-menu">
        ${themeToggleBtn()}
        ${notifBell()}
        <a class="nav-link" href="/claimed">🎬 Claimed</a>
        <a class="nav-link" href="/checkin">🎁 Check-in</a>
        <a class="user-profile" href="/profile/${session.username}">👤 ${escapeHtml(session.name)}<span class="coin-badge" id="coinBadge">💰${session.coins}</span></a>
       </div>`
    : `<div class="user-menu">${themeToggleBtn()}<a class="nav-link" href="/login">Login</a> · <a class="nav-link" href="/signup">Sign up</a></div>`;

  const body = `
    <header>
      ${wordmarkHtml(settings)}
      <form class="searchform" method="GET" action="/" autocomplete="off">
        <input class="search" type="text" name="q" id="searchInput" value="${escapeHtml(q || "")}" placeholder="Search videos...">
        <div class="autocomplete-list" id="acList"></div>
      </form>
      <a class="nav-link" href="/watchlater">📌 Watch Later</a>
      <a class="nav-link" href="/users">👥 Users</a>
      ${userArea}
    </header>
    ${previewMode ? `<div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--gold);color:#1A1200;text-align:center;padding:8px 12px;font-size:12.5px;font-weight:700;">👁 Admin Preview Mode — viewing the live site as a visitor would, with ads hidden. <a href="/admin" style="color:#1A1200;text-decoration:underline;">Back to Admin</a></div>` : ""}
    ${session ? activeTimeProgressBar() : ""}
    ${catMenu}
    <div class="perf"></div>
    <main>
      ${previewMode ? "" : adBanner(await getAdCode(env))}
      <div class="sort-tabs">
        <a class="sort-tab ${sort !== "views" && sort !== "purchased" ? "active" : ""}" href="/?sort=release${catParam}${qParam}${priceParam}">Latest Movies</a>
        <a class="sort-tab ${sort === "views" ? "active" : ""}" href="/?sort=views${catParam}${qParam}${priceParam}">Most viewed</a>
        <a class="sort-tab ${sort === "purchased" ? "active" : ""}" href="/?sort=purchased${catParam}${qParam}${priceParam}">Most purchased</a>
      </div>
      ${priceFilters}
      ${list.length ? `
        ${videoCardsArr.length ? `<div class="section-head">🎬 Movies</div><div class="grid">${videoCards}</div>` : ""}
        ${seriesCardsArr.length ? `<div class="section-head" style="margin-top:${videoCardsArr.length ? "28px" : "0"};">📺 Series</div><div class="grid">${seriesCards}</div>` : ""}
      ` : `<div class="empty"><h2>No videos found</h2><p>Try a different search or category</p></div>`}
    </main>
    ${bottomNav(session, "home")}
    ${await forcedCheckinModal(env, session, settings)}
    <script>
      var prefetched = window.__tamizhzoraPrefetched || (window.__tamizhzoraPrefetched = new Set());
      function prefetchVideo(el) {
        var src = el.getAttribute('data-prefetch');
        if (!src || prefetched.has(src)) return;
        prefetched.add(src);
        fetch(src, { headers: { Range: 'bytes=0-262144' } }).catch(() => {});
      }
      // Search autocomplete
      var acInput = document.getElementById('searchInput');
      var acList = document.getElementById('acList');
      var acTimer = null;
      acInput.addEventListener('input', () => {
        clearTimeout(acTimer);
        const val = acInput.value.trim();
        if (val.length < 2) { acList.classList.remove('show'); return; }
        acTimer = setTimeout(async () => {
          try {
            const res = await fetch('/api/search-suggest?q=' + encodeURIComponent(val));
            const data = await res.json();
            if (!data.suggestions || !data.suggestions.length) { acList.classList.remove('show'); return; }
            acList.innerHTML = data.suggestions.map(s => '<div class="autocomplete-item">' + s.replace(/</g,'&lt;') + '</div>').join('');
            acList.classList.add('show');
            acList.querySelectorAll('.autocomplete-item').forEach(item => {
              item.addEventListener('click', () => { acInput.value = item.textContent; acList.classList.remove('show'); acInput.form.submit(); });
            });
          } catch(e) {}
        }, 200);
      });
      document.addEventListener('click', (e) => { if (!acList.contains(e.target) && e.target !== acInput) acList.classList.remove('show'); });
    </script>
    ${session ? liveUpdateScript() : guestHeartbeatScript()}
  `;
  return shell(brandTitle(settings), body, { music: true, spa: true, branding: settings }); // session may be null now that Home is public
}

async function watchPage(video, src, likes, dislikes, views, comments, message, related, session, adCode, userAction, locked, purchased, ratingList, seriesInfo, freeMode, guestGate, branding, alreadyDownloaded, previewMode) {
  const nextId = related.length ? related[0].id : "";
  const ratingSum = ratingsSummary(ratingList);
  const myRating = session ? ratingList.find(r => r.userId === session.email) : null;

  const commentItems = comments.length
    ? comments.map((c) => `
      <div class="comment">
        <div class="cname">${escapeHtml(c.name || "Anonymous")}${c.isAdmin ? ' <span class="tag">Admin</span>' : ""}</div>
        <div class="ctext">${escapeHtml(c.text)}</div>
        <div class="ctime">${timeAgo(c.time)}</div>
      </div>`).join("")
    : `<div style="color:var(--text-dim);font-size:13.5px;">No comments yet. Be the first.</div>`;

  const reviewItems = ratingList.length
    ? ratingList.slice(0, 20).map((r) => `
      <div class="comment">
        <div class="cname">${escapeHtml(r.name || "Anonymous")}${r.isAdmin ? ' <span class="tag">Admin</span>' : ""} <span class="stars">${renderStars(r.stars)}</span></div>
        ${r.text ? `<div class="ctext">${escapeHtml(r.text)}</div>` : ""}
        <div class="ctime">${timeAgo(r.time)}</div>
      </div>`).join("")
    : `<div style="color:var(--text-dim);font-size:13.5px;">No reviews yet.</div>`;

  const relatedItems = related.map((v) => `
    <a class="card" href="/watch?id=${encodeURIComponent(v.id)}">
      <div class="thumb-wrap">
        <img class="thumb" src="${escapeHtml(v.thumbnail)}" loading="lazy" alt="">
        ${!freeMode && v.coinCost > 0 ? `<div class="coin-cost-badge">💰${v.coinCost}</div>` : ""}
        ${v.duration ? `<div class="duration-badge">${escapeHtml(v.duration)}</div>` : ""}
      </div>
      <div class="card-title">${escapeHtml(v.title)}</div>
    </a>`).join("");

  // Series parts are always displayed oldest → newest (upload order), and the
  // "Part N" label reflects that upload-order position — not whatever part
  // number the admin may have typed in when adding the video.
  const currentSeriesPos = seriesInfo ? seriesInfo.parts.findIndex(p => p.id === video.id) : -1;
  const seriesRow = seriesInfo ? `
    <div style="margin:14px 0 18px;">
      <div class="section-head" style="margin:0 0 8px;">📺 ${escapeHtml(seriesInfo.series.title)} — Part ${currentSeriesPos + 1}</div>
      <div class="series-row">
        ${seriesInfo.parts.map((p, idx) => `
          <a class="series-item ${p.id === video.id ? "current" : ""}" href="/watch?id=${encodeURIComponent(p.id)}">
            <img src="${escapeHtml(p.thumbnail)}" alt="">
            <div class="plabel">Part ${idx + 1}${seriesInfo.owned || (p.coinCost === 0) ? "" : " 🔒"}</div>
          </a>`).join("")}
      </div>
      ${seriesInfo.series.coinCost > 0 && !seriesInfo.owned && session && !freeMode ? `
        <button class="purchase-btn secondary" onclick="doPurchaseSeries('${seriesInfo.series.id}')">Unlock full series for 💰${seriesInfo.series.coinCost}</button>` : ""}
    </div>` : "";

  // Player skin/ad-break config — admin-controlled via Admin → 🎬 Player.
  const pcfg = branding.player || SETTINGS_DEFAULTS.player;

  const playerSection = guestGate ? `
    <div class="purchase-gate">
      <div class="pg-icon">🔒</div>
      <h3>Login to watch</h3>
      <p>Sign in to watch videos, earn coins, and unlock premium content.</p>
      <a class="purchase-btn" style="display:inline-block;" href="/login?return=${encodeURIComponent("/watch?id=" + video.id)}">Log in</a>
      <a class="purchase-btn secondary" style="display:inline-block;" href="/signup?return=${encodeURIComponent("/watch?id=" + video.id)}">Sign up</a>
    </div>` : locked ? `
    <div class="purchase-gate">
      <div class="pg-icon">🔒</div>
      <h3>This video costs 💰${video.coinCost} coins</h3>
      <p>Purchase to unlock and watch this video. It'll be saved to your Claimed tab.</p>
      <button class="purchase-btn" id="purchaseBtn" onclick="doPurchase('${video.id}')">Purchase for 💰${video.coinCost}</button>
      ${seriesInfo && seriesInfo.series.coinCost > 0 && !freeMode ? `<button class="purchase-btn secondary" onclick="doPurchaseSeries('${seriesInfo.series.id}')">Unlock series for 💰${seriesInfo.series.coinCost}</button>` : ""}
    </div>` : `
    <div class="reel-deck">
      ${pcfg.reelAnimation !== false ? `
      <div class="reel-projector-row">
        <div class="reel-spool" id="reelLeft"></div>
        <div class="reel-sprocket-strip"></div>
        <div class="reel-spool" id="reelRight"></div>
      </div>` : ""}
      <div class="reel-screen-wrap" id="reelScreenWrap">
        <video id="player" preload="auto" poster="${escapeHtml(video.thumbnail)}" controlsList="nodownload noremoteplayback" disablePictureInPicture oncontextmenu="return false;" playsinline>
          <source src="${src}" type="video/mp4">
        </video>
        ${pcfg.adsEnabled ? `
        <div class="reel-ad-overlay" id="reelAdOverlay">
          <span class="reel-ad-badge">Ad</span>
          <span class="reel-ad-timer" id="reelAdTimer">0:00</span>
          <div class="reel-ad-slate">
            <div class="headline" id="reelAdHeadline">${escapeHtml(pcfg.adHeadline || "Advertisement")}</div>
            <div class="sub" id="reelAdSub">${escapeHtml(pcfg.adSubtext || "Your video resumes automatically")}</div>
          </div>
          <button class="reel-skip-ad-btn" id="reelSkipAdBtn">Skip ad
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <div class="reel-ad-progress"><div class="reel-ad-progress-fill" id="reelAdProgressFill"></div></div>
        </div>` : ""}
        <div class="reel-overlay-controls" id="reelOverlayControls">
          <div class="reel-seek-row">
            <span class="reel-time" id="reelTimeCurrent">0:00</span>
            <input type="range" id="reelSeek" min="0" max="100" value="0" step="0.1">
            <span class="reel-time" id="reelTimeTotal">0:00</span>
          </div>
          <div class="reel-btn-row">
            <button class="reel-icon-btn reel-play" id="reelPlayBtn" aria-label="Play">
              <svg id="reelPlayIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="reel-icon-btn" onclick="skip(-10)" aria-label="Back 10 seconds">
              <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="reel-icon-btn" onclick="skip(10)" aria-label="Forward 10 seconds">
              <svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 6v12l8.5-6z"/></svg>
            </button>
            <div class="reel-vol-group">
              <button class="reel-icon-btn" id="reelMuteBtn" aria-label="Mute">
                <svg id="reelVolIcon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/></svg>
              </button>
              <input type="range" id="reelVolume" min="0" max="1" step="0.01" value="1">
            </div>
            <div class="reel-spacer"></div>
            ${pcfg.showSpeedControl !== false ? `
            <select class="reel-speed-select" id="speedSel" onchange="setSpeed(this.value)">
              <option value="0.5">0.5x</option>
              <option value="1" selected>1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>` : ""}
            <button class="reel-icon-btn" id="reelFsBtn" aria-label="Fullscreen">
              <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>
      </div>
      ${pcfg.keyboardShortcuts !== false ? `
      <div class="reel-shortcuts-hint">
        <kbd>space</kbd> play/pause &nbsp; <kbd>&larr;</kbd>/<kbd>&rarr;</kbd> seek 10s &nbsp; <kbd>&uarr;</kbd>/<kbd>&darr;</kbd> volume &nbsp; <kbd>m</kbd> mute &nbsp; <kbd>f</kbd> fullscreen
      </div>` : ""}
    </div>
    <div class="player-controls">
      <button class="act-btn" onclick="toggleTheatre()">🎭 Theatre</button>
      <label class="act-btn" style="cursor:pointer;">
        <input type="checkbox" id="autoNextChk" ${pcfg.autoNextDefault !== false ? "checked" : ""} style="margin:0;"> Auto next
      </label>
      ${session && !freeMode && !locked ? `<button class="act-btn" onclick="doDownload('${video.id}')" id="dlBtn">⬇️ ${alreadyDownloaded ? "Download again (free)" : `Download — 💰${branding.downloadCost} coin${branding.downloadCost === 1 ? "" : "s"}`}</button>` : ""}
    </div>`;

  const body = `
    <div class="watch-wrap">
      <a class="back-link" href="/">&larr; Back</a>
      ${previewMode ? `<div style="background:var(--gold);color:#1A1200;text-align:center;padding:8px 12px;font-size:12.5px;font-weight:700;border-radius:6px;margin-bottom:12px;">👁 Admin Preview Mode — ads hidden. <a href="/admin" style="color:#1A1200;text-decoration:underline;">Back to Admin</a></div>` : ""}
      ${previewMode ? "" : adBanner(adCode)}
      ${seriesRow}
      ${playerSection}

      <div class="watch-title">${escapeHtml(video.title)} ${!freeMode && video.coinCost > 0 ? `<span class="tag" style="color:var(--gold);border-color:var(--gold-dim);">💰${video.coinCost}${purchased ? " · Claimed" : ""}</span>` : ""}${freeMode && video.coinCost > 0 ? `<span class="tag" style="color:#7CD98A;border-color:#3E7A4A;">Free to watch</span>` : ""}</div>
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <span>${formatCount(views)} view${views === 1 ? "" : "s"}</span>
        ${ratingSum.count ? `<span class="stars">${renderStars(ratingSum.avg)} ${ratingSum.avg} (${formatCount(ratingSum.count)})</span>` : `<span>No ratings yet</span>`}
      </div>
      ${video.description ? `<div style="font-size:13.5px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">${escapeHtml(video.description)}</div>` : ""}

      ${!locked ? `
      <div class="action-row">
        <button class="act-btn ${userAction === "liked" ? "liked" : ""}" id="likeBtn" onclick="doLike('${video.id}')" title="${likes} like${likes === 1 ? "" : "s"}">
          ❤️ <span id="likeCount">${formatCount(likes)}</span>
        </button>
        <button class="act-btn ${userAction === "disliked" ? "disliked" : ""}" id="dislikeBtn" onclick="doDislike('${video.id}')" title="${dislikes} dislike${dislikes === 1 ? "" : "s"}">
          👎 <span id="dislikeCount">${formatCount(dislikes)}</span>
        </button>
        <button class="act-btn" onclick="doShare('${escapeHtml(video.title)}')">🔗 Share</button>
        <button class="act-btn" id="saveBtn" onclick="toggleSave('${video.id}')">
          <span id="saveIcon">☆</span> Save
        </button>
      </div>

      <div style="margin-top:28px;border-top:1px solid var(--border);padding-top:20px;">
        <h3 style="font-size:14px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Rate this video</h3>
        ${session ? `
        <form id="ratingForm" onsubmit="return submitRating(event, '${video.id}')">
          <div id="starPicker" style="margin-bottom:10px;">
            ${[1,2,3,4,5].map(n => `<span class="star-input ${myRating && myRating.stars >= n ? "filled" : ""}" data-val="${n}" onclick="pickStar(${n})">★</span>`).join("")}
          </div>
          <input type="hidden" id="starValue" value="${myRating ? myRating.stars : 0}">
          <textarea id="reviewText" placeholder="Write a short review (optional)">${myRating ? escapeHtml(myRating.text || "") : ""}</textarea>
          <button type="submit">${myRating ? "Update review" : "Submit review"}</button>
          ${myRating ? `<button type="button" class="purchase-btn secondary" style="margin-top:16px;margin-left:8px;padding:13px 22px;" onclick="removeMyReview('${video.id}')">Remove my review</button>` : ""}
        </form>` : `<div style="color:var(--text-dim);font-size:13px;">Please <a href="/login" style="color:var(--gold);">login</a> to rate.</div>`}
        <div id="reviewList" style="margin-top:16px;">${reviewItems}</div>
      </div>

      <div style="margin-top:32px;border-top:1px solid var(--border);padding-top:20px;">
        <h3 style="font-size:14px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:16px;">Comments (${formatCount(comments.length)})</h3>
        ${message ? `<div class="msg">${escapeHtml(message)}</div>` : ""}
        ${session
          ? `<form method="POST" action="/comment/add" style="margin-bottom:20px;">
              <input type="hidden" name="id" value="${video.id}">
              <textarea name="text" required placeholder="Add a comment..."></textarea>
              <button type="submit">Post comment</button>
            </form>`
          : `<div style="background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:14px;color:var(--text-dim);font-size:13.5px;margin-bottom:20px;">
              Please <a href="/login" style="color:var(--gold);font-weight:600;">login</a> to comment
            </div>`}
        <div id="commentList">${commentItems}</div>
      </div>` : `
      <div style="margin-top:24px;">
        ${message ? `<div class="msg ${message.toLowerCase().includes('fail') || message.toLowerCase().includes('not enough') ? 'err' : ''}">${escapeHtml(message)}</div>` : ""}
      </div>`}

      ${relatedItems ? `
      <div style="margin-top:36px;border-top:1px solid var(--border);padding-top:20px;">
        <h3 style="font-size:14px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;">More videos</h3>
        <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));">${relatedItems}</div>
      </div>` : ""}
    </div>

    <div class="toast" id="toast"></div>
    ${bottomNav(session, "")}

    <script>
      const isLoggedIn = ${session ? "true" : "false"};
      const locked = ${locked ? "true" : "false"};

      // Mirrors the server-side formatCount() so live-updated counts (after
      // liking/disliking) stay YouTube-style ("1.2K") instead of jumping
      // back to a raw number.
      function formatCountJs(n) {
        n = Number(n) || 0;
        if (n < 1000) return String(n);
        const tiers = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
        for (const [v, suffix] of tiers) {
          if (n >= v) {
            const num = n / v;
            const decimals = num < 10 ? 1 : 0;
            return num.toFixed(decimals).replace(/\\.0$/, '') + suffix;
          }
        }
        return String(n);
      }

      function pickStar(n) {
        document.getElementById('starValue').value = n;
        document.querySelectorAll('.star-input').forEach(el => {
          el.classList.toggle('filled', parseInt(el.dataset.val) <= n);
        });
      }
      async function submitRating(e, id) {
        e.preventDefault();
        const stars = parseInt(document.getElementById('starValue').value || '0');
        if (!stars) { alert('Please pick a star rating'); return false; }
        const text = document.getElementById('reviewText').value;
        const res = await fetch('/api/rate', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, stars, text }) });
        if (res.ok) { window.location.reload(); }
        return false;
      }
      async function removeMyReview(id) {
        if (!confirm('Remove your review?')) return;
        try {
          const res = await fetch('/api/rate/delete', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
          if (res.ok) window.location.reload();
        } catch(e){}
      }
      async function doPurchaseSeries(seriesId) {
        try {
          const res = await fetch('/api/purchase-series', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: seriesId }) });
          const data = await res.json();
          if (!res.ok) { alert(data.error || 'Purchase failed'); return; }
          window.location.reload();
        } catch(e){}
      }
      async function doDownload(id) {
        const btn = document.getElementById('dlBtn');
        const originalLabel = btn ? btn.textContent : '⬇️ Download';
        if (btn) { btn.disabled = true; btn.textContent = 'Preparing...'; }
        try {
          const res = await fetch('/api/download', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
          const data = await res.json();
          if (!res.ok) {
            // Server is the only source of truth on eligibility/cost/balance —
            // this just surfaces whatever it decided (not enough coins, not
            // purchased, free-mode, etc.) without triggering any download.
            alert(data.error || 'Download failed');
            if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
            return;
          }
          const a = document.createElement('a');
          a.href = data.url; a.download = data.filename || ''; a.target = '_blank';
          document.body.appendChild(a); a.click(); a.remove();
          if (btn) { btn.disabled = false; btn.textContent = '⬇️ Download again (free)'; }
        } catch(e) { if (btn) { btn.disabled = false; btn.textContent = originalLabel; } }
      }

      ${!locked ? `
      const player = document.getElementById('player');
      const posKey = 'resume:${video.id}';
      const nextId = ${JSON.stringify(nextId)};
      const PCFG = ${JSON.stringify(pcfg)};

      // ── Reel player chrome: custom controls, reel-spin, ad breaks ──────
      const reelEls = {
        screenWrap: document.getElementById('reelScreenWrap'),
        overlay: document.getElementById('reelOverlayControls'),
        seek: document.getElementById('reelSeek'),
        timeCurrent: document.getElementById('reelTimeCurrent'),
        timeTotal: document.getElementById('reelTimeTotal'),
        playBtn: document.getElementById('reelPlayBtn'),
        playIcon: document.getElementById('reelPlayIcon'),
        volume: document.getElementById('reelVolume'),
        muteBtn: document.getElementById('reelMuteBtn'),
        volIcon: document.getElementById('reelVolIcon'),
        fsBtn: document.getElementById('reelFsBtn'),
        reelLeft: document.getElementById('reelLeft'),
        reelRight: document.getElementById('reelRight'),
        adOverlay: document.getElementById('reelAdOverlay'),
        adTimer: document.getElementById('reelAdTimer'),
        adProgressFill: document.getElementById('reelAdProgressFill'),
        skipAdBtn: document.getElementById('reelSkipAdBtn')
      };

      const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
      const ICON_PAUSE = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';
      const ICON_VOL = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/>';
      const ICON_MUTE = '<path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.42.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';

      function formatReelTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + String(s).padStart(2, '0');
      }

      let adActive = false;
      let adInterval = null;
      let preRollDone = false;
      let midRollDone = false;

      function playAd(type, onComplete) {
        if (!reelEls.adOverlay) { onComplete && onComplete(); return; }
        const duration = type === 'preroll' ? (PCFG.prerollSeconds || 12) : (PCFG.midrollSeconds || 8);
        const skipAfter = PCFG.skipAfterSeconds || 5;
        let elapsed = 0;
        adActive = true;
        reelEls.adOverlay.classList.add('showing');
        reelEls.skipAdBtn.classList.remove('visible');
        reelEls.adProgressFill.style.width = '0%';
        reelEls.adTimer.textContent = formatReelTime(duration);

        function endAd() {
          clearInterval(adInterval);
          adActive = false;
          reelEls.adOverlay.classList.remove('showing');
          reelEls.skipAdBtn.onclick = null;
          if (onComplete) onComplete();
        }
        reelEls.skipAdBtn.onclick = endAd;
        clearInterval(adInterval);
        adInterval = setInterval(() => {
          elapsed += 0.2;
          const remaining = Math.max(0, duration - elapsed);
          reelEls.adTimer.textContent = formatReelTime(remaining);
          reelEls.adProgressFill.style.width = Math.min(100, (elapsed / duration) * 100) + '%';
          if (elapsed >= skipAfter) reelEls.skipAdBtn.classList.add('visible');
          if (elapsed >= duration) endAd();
        }, 200);
      }

      function requestPlay() {
        if (adActive) return;
        if (PCFG.adsEnabled && !preRollDone) {
          preRollDone = true;
          player.pause();
          playAd('preroll', () => player.play());
        } else {
          player.play();
        }
      }

      function maybeTriggerMidroll() {
        if (!PCFG.adsEnabled || adActive || midRollDone || !player.duration) return;
        const atPct = (PCFG.midrollAtPercent != null ? PCFG.midrollAtPercent : 50) / 100;
        if (player.currentTime > player.duration * atPct) {
          midRollDone = true;
          player.pause();
          playAd('midroll', () => player.play());
        }
      }

      function setReelPlayingState(playing) {
        if (reelEls.playIcon) reelEls.playIcon.parentElement.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
        if (reelEls.reelLeft) reelEls.reelLeft.classList.toggle('spin', playing);
        if (reelEls.reelRight) reelEls.reelRight.classList.toggle('spin', playing);
        if (reelEls.screenWrap) reelEls.screenWrap.classList.toggle('reel-paused', !playing);
      }

      function updateReelSeek() {
        const cur = player.currentTime || 0;
        const dur = player.duration || 0;
        if (reelEls.timeCurrent) reelEls.timeCurrent.textContent = formatReelTime(cur);
        if (reelEls.timeTotal) reelEls.timeTotal.textContent = formatReelTime(dur);
        if (reelEls.seek) reelEls.seek.value = dur > 0 ? (cur / dur) * 100 : 0;
      }

      if (reelEls.playBtn) reelEls.playBtn.addEventListener('click', () => {
        if (adActive) return;
        player.paused ? requestPlay() : player.pause();
      });
      player.addEventListener('click', () => {
        if (adActive) return;
        player.paused ? requestPlay() : player.pause();
      });
      if (reelEls.seek) reelEls.seek.addEventListener('input', () => {
        if (!player.duration || adActive) return;
        player.currentTime = (reelEls.seek.value / 100) * player.duration;
      });
      if (reelEls.volume) {
        reelEls.volume.addEventListener('input', () => {
          player.volume = parseFloat(reelEls.volume.value);
          player.muted = player.volume === 0;
          reelEls.volIcon.parentElement.innerHTML = player.muted ? ICON_MUTE : ICON_VOL;
        });
      }
      if (reelEls.muteBtn) reelEls.muteBtn.addEventListener('click', () => {
        player.muted = !player.muted;
        reelEls.volIcon.parentElement.innerHTML = player.muted ? ICON_MUTE : ICON_VOL;
      });
      if (reelEls.fsBtn) reelEls.fsBtn.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else reelEls.screenWrap.requestFullscreen();
      });
      if (reelEls.screenWrap) {
        let hideTimer = null;
        reelEls.screenWrap.addEventListener('mousemove', () => {
          reelEls.screenWrap.classList.add('show-controls');
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            if (!player.paused) reelEls.screenWrap.classList.remove('show-controls');
          }, 2200);
        });
        reelEls.screenWrap.addEventListener('mouseleave', () => {
          if (!player.paused) reelEls.screenWrap.classList.remove('show-controls');
        });
      }
      player.addEventListener('play', () => setReelPlayingState(true));
      player.addEventListener('pause', () => setReelPlayingState(false));
      player.addEventListener('timeupdate', () => { updateReelSeek(); maybeTriggerMidroll(); });
      player.addEventListener('loadedmetadata', updateReelSeek);

      // Auto-start (through the ad gate) the same way native autoplay used to.
      requestPlay();

      const saved = PCFG.resumePlayback === false ? null : localStorage.getItem(posKey);
      if (saved) {
        player.addEventListener('loadedmetadata', () => {
          const t = parseFloat(saved);
          if (t > 5 && t < player.duration - 15) player.currentTime = t;
        }, { once: true });
      }
      setInterval(() => {
        if (PCFG.resumePlayback === false) return;
        if (!player.paused) localStorage.setItem(posKey, player.currentTime);
      }, 5000);
      player.addEventListener('ended', () => {
        localStorage.removeItem(posKey);
        if (nextId && document.getElementById('autoNextChk').checked) {
          window.location.href = '/watch?id=' + encodeURIComponent(nextId);
        }
      });

      function skip(sec) { if (!adActive) player.currentTime += sec; }
      function setSpeed(rate) { player.playbackRate = parseFloat(rate); }
      function toggleTheatre() { document.body.classList.toggle('theatre'); }

      // Count a "view" only once this video has been actively watched for
      // 5+ minutes (300s), not just opened. Small skips/seeks are ignored
      // via the delta cap so scrubbing can't fast-forward the count.
      (function () {
        if (!isLoggedIn) return;
        let watchedSeconds = 0;
        let lastTime = 0;
        let viewCounted = false;
        player.addEventListener('timeupdate', () => {
          const delta = player.currentTime - lastTime;
          if (delta > 0 && delta < 2) watchedSeconds += delta;
          lastTime = player.currentTime;
          if (!viewCounted && watchedSeconds >= 300) {
            viewCounted = true;
            fetch('/api/view', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: '${video.id}' }) }).catch(() => {});
          }
        });
      })();

      if (PCFG.keyboardShortcuts !== false) {
        document.addEventListener('keydown', (e) => {
          const tag = document.activeElement.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
          if (e.code === 'Space') {
            e.preventDefault();
            if (adActive) return;
            player.paused ? requestPlay() : player.pause();
          } else if (e.key === 'ArrowRight') { e.preventDefault(); skip(10); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); skip(-10); }
          else if (e.key === 'ArrowUp') {
            e.preventDefault();
            player.volume = Math.min(1, player.volume + 0.05);
            player.muted = false;
            if (reelEls.volume) reelEls.volume.value = player.volume;
            if (reelEls.volIcon) reelEls.volIcon.parentElement.innerHTML = ICON_VOL;
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            player.volume = Math.max(0, player.volume - 0.05);
            if (reelEls.volume) reelEls.volume.value = player.volume;
            if (reelEls.volIcon) reelEls.volIcon.parentElement.innerHTML = player.volume === 0 ? ICON_MUTE : ICON_VOL;
          } else if (e.key === 'm' || e.key === 'M') {
            player.muted = !player.muted;
            if (reelEls.volIcon) reelEls.volIcon.parentElement.innerHTML = player.muted ? ICON_MUTE : ICON_VOL;
          } else if (e.key === 'f' || e.key === 'F') {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (reelEls.screenWrap) reelEls.screenWrap.requestFullscreen();
          }
        });
      }

      async function doLike(id) {
        if (!isLoggedIn) { window.location.href = '/login'; return; }
        const res = await fetch('/api/like', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await res.json();
        document.getElementById('likeCount').textContent = formatCountJs(data.likes);
        document.getElementById('dislikeCount').textContent = formatCountJs(data.dislikes);
        const likeBtn = document.getElementById('likeBtn');
        const dislikeBtn = document.getElementById('dislikeBtn');
        likeBtn.classList.toggle('liked', data.userAction === 'liked');
        dislikeBtn.classList.remove('disliked');
        if (data.userAction !== 'liked') likeBtn.classList.remove('liked');
      }

      async function doDislike(id) {
        if (!isLoggedIn) { window.location.href = '/login'; return; }
        const res = await fetch('/api/dislike', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await res.json();
        document.getElementById('likeCount').textContent = data.likes;
        document.getElementById('dislikeCount').textContent = data.dislikes;
        const likeBtn = document.getElementById('likeBtn');
        const dislikeBtn = document.getElementById('dislikeBtn');
        dislikeBtn.classList.toggle('disliked', data.userAction === 'disliked');
        likeBtn.classList.remove('liked');
        if (data.userAction !== 'disliked') dislikeBtn.classList.remove('disliked');
      }

      function doShare(title) {
        const url = window.location.href;
        if (navigator.share) { navigator.share({ title, url }).catch(() => {}); }
        else {
          navigator.clipboard.writeText(url);
          const t = document.getElementById('toast');
          t.textContent = 'Link copied!';
          t.classList.add('show');
          setTimeout(() => t.classList.remove('show'), 2000);
        }
      }

      function getSaved() {
        try { return JSON.parse(localStorage.getItem('watchlater') || '[]'); } catch (e) { return []; }
      }
      function toggleSave(id) {
        let list = getSaved();
        const btn = document.getElementById('saveBtn');
        const icon = document.getElementById('saveIcon');
        if (list.includes(id)) {
          list = list.filter(x => x !== id);
          btn.classList.remove('liked'); icon.innerHTML = '☆';
        } else {
          list.push(id);
          btn.classList.add('liked'); icon.innerHTML = '★';
        }
        localStorage.setItem('watchlater', JSON.stringify(list));
      }
      if (getSaved().includes('${video.id}')) {
        document.getElementById('saveBtn').classList.add('liked');
        document.getElementById('saveIcon').innerHTML = '★';
      }
      ` : ""}

      async function doPurchase(id) {
        const btn = document.getElementById('purchaseBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Purchasing...'; }
        try {
          const res = await fetch('/api/purchase', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (!res.ok) {
            const t = document.getElementById('toast');
            t.textContent = data.error || 'Purchase failed';
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2500);
            if (btn) { btn.disabled = false; btn.textContent = 'Purchase for 💰${video.coinCost}'; }
            return;
          }
          const t = document.getElementById('toast');
          t.textContent = 'Purchase successful! Video claimed 🎉';
          t.classList.add('show');
          setTimeout(() => { window.location.reload(); }, 900);
        } catch (e) {
          if (btn) { btn.disabled = false; btn.textContent = 'Purchase for 💰${video.coinCost}'; }
        }
      }
    </script>
    ${session ? liveUpdateScript() : ""}
  `;
  return shell(brandTitle(branding, video.title), body, { branding });
}

// Reusable "Continue with Google" button — links to /auth/google, carrying
// an optional referral code through the OAuth `state` param.
function googleAuthButton(refCode, returnTo) {
  const params = [];
  if (refCode) params.push("ref=" + encodeURIComponent(refCode));
  if (returnTo) params.push("return=" + encodeURIComponent(returnTo));
  const href = "/auth/google" + (params.length ? "?" + params.join("&") : "");
  return `
    <a class="google-btn" href="${href}" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#fff;color:#1f1f1f;font-weight:600;font-size:14.5px;padding:12px 16px;border-radius:8px;border:1px solid var(--border);margin-top:6px;">
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
      </svg>
      Continue with Google
    </a>`;
}

function loginPage(message, clearLocal, returnTo, branding) {
  const body = `
    <div class="auth-wrap">
      <div class="admin-title">Log in</div>
      ${message ? `<div class="msg err">${escapeHtml(message)}</div>` : ""}
      <p style="color:var(--text-dim);font-size:13px;margin-bottom:4px;">${escapeHtml((branding && branding.siteName) || "TAMIZH ZORA")} signs in with Google only — no passwords to remember.</p>
      ${googleAuthButton(null, returnTo)}
      <p style="color:var(--text-dim);font-size:13px;margin-top:16px;">No account? Just continue with Google above — a new account is created automatically with 50 free coins.</p>
    </div>
    ${clearLocal ? `<script>try{localStorage.clear();}catch(e){}</script>` : ""}`;
  return shell(brandTitle(branding, "Log in"), body, { branding });
}

function signupPage(message, refCode, returnTo, branding) {
  const body = `
    <div class="auth-wrap">
      <div class="admin-title">Create account</div>
      ${message ? `<div class="msg err">${escapeHtml(message)}</div>` : ""}
      ${refCode ? `<div class="msg">You were referred with code <strong>${escapeHtml(refCode)}</strong> — you'll both get a bonus!</div>` : ""}
      <p style="color:var(--text-dim);font-size:13px;margin-bottom:4px;">Sign up with Google — get 50 free coins instantly, no password needed.</p>
      ${googleAuthButton(refCode, returnTo)}
      <p style="color:var(--text-dim);font-size:13px;margin-top:16px;">Already have an account? Just continue with Google above — you'll be logged straight in.</p>
    </div>`;
  return shell(brandTitle(branding, "Sign up"), body, { branding });
}

// Shown once, immediately after a brand-new Google sign-in, so the user can
// swap their auto-generated (email-derived) username for one of their own
// choosing before browsing the site.
function chooseUsernamePage(user, message, returnTo, branding) {
  const body = `
    <div class="auth-wrap">
      <div class="admin-title">Pick a username</div>
      <p style="color:var(--text-dim);font-size:13px;margin-bottom:4px;">Welcome, ${escapeHtml(user.name)}! We started you off with <strong>@${escapeHtml(user.username)}</strong> — feel free to keep it or choose your own.</p>
      ${message ? `<div class="msg err">${escapeHtml(message)}</div>` : ""}
      <form method="POST" action="/choose-username">
        ${returnTo ? `<input type="hidden" name="return" value="${escapeHtml(returnTo)}">` : ""}
        <label>Username</label>
        <input type="text" name="username" required minlength="3" maxlength="20" pattern="[a-z0-9_]{3,20}" value="${escapeHtml(user.username)}" placeholder="choose_username" autofocus>
        <p style="color:var(--text-dim);font-size:11.5px;margin:6px 0 0;">3–20 characters: lowercase letters, numbers, and underscores only.</p>
        <button type="submit" style="margin-top:14px;">Continue to ${escapeHtml((branding && branding.siteName) || "TAMIZH ZORA")}</button>
      </form>
    </div>`;
  return shell(brandTitle(branding, "Choose your username"), body, { branding });
}

function editVideoPage(video, cats, seriesList, message) {
  const catOptions = cats.map(c =>
    `<option value="${escapeHtml(c.name)}" ${video.category === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`
  ).join("");

  const seriesOptions = seriesList.map(s =>
    `<option value="${escapeHtml(s.id)}" ${video.seriesId === s.id ? "selected" : ""}>${escapeHtml(s.title)}</option>`
  ).join("");

  const publishVal = video.publishAt ? new Date(Number(video.publishAt)).toISOString().slice(0, 16) : "";

  const body = `
    <div class="admin-wrap">
      <div class="admin-title">Edit video</div>
      ${message ? `<div class="msg">${escapeHtml(message)}</div>` : ""}
      <form method="POST" action="/admin/edit">
        <input type="hidden" name="id" value="${escapeHtml(video.id)}">
        <label>Title</label>
        <input type="text" name="title" required value="${escapeHtml(video.title)}">
        <label>Google Drive File ID</label>
        <input type="text" name="driveId" required value="${escapeHtml(video.driveId)}">
        <label>Thumbnail URL</label>
        <input type="text" name="thumbnail" required value="${escapeHtml(video.thumbnail)}">
        <label>Duration (optional)</label>
        <input type="text" name="duration" value="${escapeHtml(video.duration || "")}">
        <label>Coin cost to unlock (0 = free)</label>
        <input type="number" name="coinCost" min="0" value="${video.coinCost || 0}">
        <label>Category</label>
        <select name="category"><option value="">— None —</option>${catOptions}</select>
        <label>Sub-category</label>
        <input type="text" name="subCategory" value="${escapeHtml(video.subCategory || "")}" placeholder="e.g. Vlogs, Tutorials">
        <label>Series (optional — for multi-part uploads)</label>
        <select name="seriesId"><option value="">— Not part of a series —</option>${seriesOptions}</select>
        <label>Part number (legacy — kept for backward compatibility, no longer used for ordering)</label>
        <input type="number" name="part" min="1" value="${video.part || 1}">
        <label>Part order (optional — controls this part's position within its series; leave blank to keep the automatic upload-date order)</label>
        <input type="number" name="partOrder" min="1" value="${video.partOrder != null ? video.partOrder : ""}" placeholder="e.g. 1, 2, 3...">
        <label>Publish date/time (leave blank to publish immediately)</label>
        <input type="datetime-local" name="publishAt" value="${publishVal}">
        <label>Release Date (NEW — the movie's actual displayed release date; separate from Publish date/time above)</label>
        <input type="date" name="releaseDate" value="${escapeHtml(video.releaseDate || "")}">
        <label>Description (optional)</label>
        <textarea name="description">${escapeHtml(video.description || "")}</textarea>
        <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;margin-top:14px;">
          <input type="checkbox" name="draft" ${video.draft ? "checked" : ""} style="width:auto;margin:0;"> Draft (hidden from everyone until published — direct links blocked too, only admins can preview it)
        </label>
        <button type="submit">Save changes</button>
      </form>
      <p style="margin-top:20px;"><a class="nav-link" href="/admin?tab=videos">&larr; Back to admin</a></p>
    </div>`;
  return shell("Edit video — Admin", body);
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

// Stat keys achievements can be built on, plus a human label for the admin
// dropdown. Keep in sync with computeUserStats() in the KV helpers section.
const ACHIEVEMENT_STATS = [
  { key: "watchHours", label: "Total hours watched (lifetime)" },
  { key: "checkinStreak", label: "Daily check-in streak (days)" },
  { key: "referralCount", label: "Friends referred" },
  { key: "purchaseCount", label: "Videos/series unlocked" },
  { key: "reviewCount", label: "Reviews written" },
  { key: "accountAgeDaysVerified", label: "Account verified (1 = yes)" }
];

async function adminDashboard(videos, users, cats, seriesList, activeTab, message, env, usearch, totalUsers, vq, vsort, txuser) {
  const activeVideos = videos.filter(v => !v.deleted);
  const trashedVideos = videos.filter(v => v.deleted);
  const ads = activeTab === "ads" ? await getAds(env) : [];
  const adRows = ads.length ? ads.map(a => `
    <tr>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.type || "html")}</td>
      <td>${escapeHtml(a.placement || "home")}</td>
      <td>${a.priority || 0}</td>
      <td><span class="tag ${a.status === "active" ? "tag-green" : ""}">${a.status}</span></td>
      <td>${new Date(a.createdAt).toLocaleDateString()}</td>
      <td>${new Date(a.updatedAt || a.createdAt).toLocaleDateString()}</td>
      <td><button type="button" class="ban-btn" style="padding:5px 10px;font-size:11px;" onclick="alert(${JSON.stringify(escapeHtml((a.code || "").slice(0, 400)))})">Preview</button></td>
      <td style="white-space:nowrap;">
        <form method="POST" action="/admin/ads/toggle" style="display:inline;"><input type="hidden" name="id" value="${a.id}"><button type="submit" class="ban-btn" style="padding:5px 10px;font-size:11px;">${a.status === "active" ? "Disable" : "Enable"}</button></form>
        <form method="POST" action="/admin/ads/delete" style="display:inline;" onsubmit="return confirm('Delete this ad?');"><input type="hidden" name="id" value="${a.id}"><button type="submit" class="ban-btn" style="padding:5px 10px;font-size:11px;">Delete</button></form>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="9" style="text-align:center;padding:24px;opacity:.6;">No ads yet.</td></tr>`;

  const enriched = await Promise.all(activeVideos.map(async v => {
    const vd = await getViews(env, v.id);
    const ld = await getLikeData(env, v.id);
    const pc = await getPurchaseCount(env, v.id);
    return { ...v, views: vd.count, likes: ld.likes, dislikes: ld.dislikes, purchaseCount: pc };
  }));

  const settings = await getBranding(env);
  const achievementCatalog = activeTab === "achievements" ? getAchievementCatalog(settings) : [];
  usearch = usearch || "";
  totalUsers = totalUsers != null ? totalUsers : users.length;

  const ipCounts = {};
  users.forEach(u => { if (u.signupIp) ipCounts[u.signupIp] = (ipCounts[u.signupIp] || 0) + 1; });

  const fmtDate = (ts) => ts ? new Date(ts).toLocaleString() : "—";

  const userRows = users.map((u) => `
    <tr>
      <td style="max-width:170px;">
        <div><a href="/admin/user?email=${encodeURIComponent(u.email)}" style="color:var(--gold);font-weight:600;">${escapeHtml(u.username)}</a></div>
        <div style="font-size:10.5px;color:var(--text-dim);margin-top:3px;word-break:break-all;">${escapeHtml(u.email)}</div>
        <div style="font-size:10.5px;color:var(--text-dim);margin-top:2px;">Joined: ${fmtDate(u.createdAt)}</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;word-break:break-all;" title="One-way hash — the real password isn't stored, so it can't be shown. Use Reset password to set a new one.">🔒 ${u.passwordHash ? escapeHtml(u.passwordHash.slice(0, 16)) + "…" : "—"}</div>
      </td>
      <td style="font-size:11.5px;">
        <div>Signup IP: <span style="color:${u.signupIp && ipCounts[u.signupIp] > 1 ? "var(--danger)" : "var(--text-dim)"};">${escapeHtml(u.signupIp || "—")}${u.signupIp && ipCounts[u.signupIp] > 1 ? " ⚠️" : ""}</span></div>
        <div style="margin-top:3px;">Last login IP: <span style="color:var(--text-dim);">${escapeHtml(u.lastLoginIp || "—")}</span></div>
        <div style="margin-top:3px;color:var(--text-dim);">${fmtDate(u.lastLoginAt)}</div>
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:6px;min-width:170px;">
          <form method="POST" action="/admin/user-coins" style="display:flex;gap:4px;align-items:center;">
            <input type="hidden" name="email" value="${escapeHtml(u.email)}">
            <input type="number" name="coins" value="${u.coins}" style="width:70px;padding:4px 8px;margin:0;font-size:12px;">
            <button type="submit" style="margin:0;padding:4px 8px;font-size:11px;border-radius:4px;">Set</button>
          </form>
          <form method="POST" action="/admin/user-coins-adjust" style="display:flex;gap:4px;align-items:center;">
            <input type="hidden" name="email" value="${escapeHtml(u.email)}">
            <input type="number" name="amount" placeholder="amt" min="1" style="width:60px;padding:4px 8px;margin:0;font-size:12px;">
            <button type="submit" name="action" value="add" style="margin:0;padding:4px 8px;font-size:11px;border-radius:4px;background:var(--bg-panel-2);border:1px solid var(--gold-dim);color:var(--gold);">+ Add</button>
            <button type="submit" name="action" value="deduct" style="margin:0;padding:4px 8px;font-size:11px;border-radius:4px;background:var(--danger-bg);border:1px solid var(--danger);color:var(--danger);">- Deduct</button>
          </form>
        </div>
      </td>
      <td style="font-size:11.5px;max-width:130px;">
        ${u.verified ? '<span style="color:#7CD98A;font-weight:700;">✓ Verified</span>' : '<span style="color:var(--text-dim);">Unverified</span>'}
        ${u.provider === "google" ? '<div class="tag" style="margin-top:4px;">via Google</div>' : ""}
        <form method="POST" action="/admin/user-verify" class="inline-form" style="margin-top:6px;">
          <input type="hidden" name="email" value="${escapeHtml(u.email)}">
          <button class="${u.verified ? "unban-btn" : "ban-btn"}" type="submit">${u.verified ? "Unverify" : "Verify"}</button>
        </form>
      </td>
      <td style="font-size:11.5px;max-width:150px;">
        ${u.isBanned ? '<span style="color:var(--danger);font-weight:600;">🚫 Banned</span>' : '<span style="color:var(--gold);">✓ Active</span>'}
        ${u.isBanned && u.banReason ? `<div style="color:var(--danger);margin-top:3px;">${escapeHtml(u.banReason)}</div>` : ""}
      </td>
      <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <form method="POST" action="/admin/user-ban" class="inline-form">
          <input type="hidden" name="email" value="${escapeHtml(u.email)}">
          <button class="${u.isBanned ? "unban-btn" : "ban-btn"}" type="submit">${u.isBanned ? "Unban" : "Ban"}</button>
        </form>
        <form method="POST" action="/admin/user-reset-local" class="inline-form">
          <input type="hidden" name="email" value="${escapeHtml(u.email)}">
          <button class="unban-btn" type="submit" title="Force this user's browser to clear its saved local data (watch later, saved position, device id)">↺ Reset local data</button>
        </form>
        <form method="POST" action="/admin/user-delete" class="inline-form" onsubmit="return dangerConfirm(this, ${JSON.stringify(u.username)})">
          <input type="hidden" name="email" value="${escapeHtml(u.email)}">
          <button class="del-btn" type="submit">Delete</button>
        </form>
        <a class="edit-btn" href="/admin?tab=transactions&txuser=${encodeURIComponent(u.username)}" title="View this user's transactions">💳 Transactions</a>
      </td>
    </tr>`).join("");

  // MOVIES TAB (NEW — Feature: Admin Movies/Series separation) — standalone
  // movies only; videos that belong to a series are managed from the Series
  // tab instead, per the spec, so they don't appear twice.
  const standaloneVideos = enriched.filter(v => !v.seriesId);
  const movieSearch = (vq || "").toString().trim().toLowerCase();
  const movieSort = (vsort || "newest").toString();
  let moviesFiltered = movieSearch
    ? standaloneVideos.filter(v => v.title.toLowerCase().includes(movieSearch) || (v.category || "").toLowerCase().includes(movieSearch))
    : standaloneVideos;
  moviesFiltered = [...moviesFiltered];
  // Consolidated on the same getReleaseTimestamp() used by the home page's
  // sortByRelease — one source of truth for what counts as a valid release
  // date and how missing/malformed values are ordered (always last).
  const releaseSortCmp = (a, b, dir) => {
    const ta = getReleaseTimestamp(a.releaseDate), tb = getReleaseTimestamp(b.releaseDate);
    if (ta !== null && tb !== null) { if (ta !== tb) return dir * (tb - ta); }
    else if (ta !== null) return -1;
    else if (tb !== null) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  };
  if (movieSort === "title") moviesFiltered.sort((a, b) => a.title.localeCompare(b.title));
  else if (movieSort === "views") moviesFiltered.sort((a, b) => b.views - a.views);
  else if (movieSort === "release") moviesFiltered.sort((a, b) => releaseSortCmp(a, b, 1));
  else if (movieSort === "release-old") moviesFiltered.sort((a, b) => releaseSortCmp(a, b, -1));
  else if (movieSort === "oldest") moviesFiltered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  else if (movieSort === "year") moviesFiltered.sort((a, b) => {
    const ya = getReleaseTimestamp(a.releaseDate), yb = getReleaseTimestamp(b.releaseDate);
    if (ya !== null && yb !== null) { if (ya !== yb) return yb - ya; }
    else if (ya !== null) return -1;
    else if (yb !== null) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  else if (movieSort === "hidden") moviesFiltered.sort((a, b) => (b.hidden ? 1 : 0) - (a.hidden ? 1 : 0));
  else moviesFiltered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // newest upload (default)

  const videoRows = moviesFiltered.map((v) => `
    <tr>
      <td style="max-width:190px;word-break:break-word;">
        <img src="${escapeHtml(v.thumbnail)}" alt="" style="width:64px;aspect-ratio:16/9;object-fit:cover;border-radius:4px;display:block;margin-bottom:6px;">
        ${escapeHtml(v.title)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:3px;word-break:break-all;">ID: ${escapeHtml(v.id)}</div>
      </td>
      <td style="font-size:11.5px;max-width:140px;">
        ${v.category ? `<div class="tag">${escapeHtml(v.category)}</div>` : `<span style="color:var(--text-dim);">—</span>`}
        ${v.subCategory ? `<div class="tag" style="margin-top:3px;">${escapeHtml(v.subCategory)}</div>` : ""}
      </td>
      <td style="font-size:10.5px;color:var(--text-dim);word-break:break-all;max-width:130px;">${escapeHtml(v.driveId)}</td>
      <td>${v.coinCost > 0 ? `💰${v.coinCost}` : `<span style="color:#7CD98A;">Free</span>`}</td>
      <td style="font-size:11px;white-space:nowrap;">
        ${v.releaseDate ? `<span class="release-pill">📅 ${escapeHtml(v.releaseDate)}</span>` : `<span style="color:var(--text-dim);">—</span>`}
      </td>
      <td style="font-size:11.5px;">
        ${getReleaseTimestamp(v.releaseDate) !== null ? `<span class="release-pill">${new Date(getReleaseTimestamp(v.releaseDate)).getFullYear()}</span>` : `<span style="color:var(--text-dim);">—</span>`}
      </td>
      <td style="font-size:11px;white-space:nowrap;">
        ${v.draft ? `<span class="release-pill" style="color:#D9A857;border-color:#8F6A2B;">📝 Draft</span>` : v.hidden ? `<span class="release-pill hidden-pill">🚫 Hidden</span>` : isScheduledFuture(v) ? `<span class="release-pill" style="color:#8AB4F2;border-color:#3A5A8F;">⏰ Scheduled</span>` : `<span class="release-pill visible-pill">✓ Visible</span>`}
      </td>
      <td>
        <form method="POST" action="/admin/set-views" style="display:flex;gap:4px;align-items:center;">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <input type="number" name="views" value="${v.views}" min="0" style="width:70px;padding:4px 8px;margin:0;font-size:11px;">
          <button type="submit" style="margin:0;padding:4px 7px;font-size:10px;border-radius:4px;">Set</button>
        </form>
        <form method="POST" action="/admin/reset-views" class="inline-form">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <button type="submit" style="margin-top:4px;padding:3px 7px;font-size:10px;border-radius:4px;background:var(--bg-panel-2);border:1px solid var(--border);color:var(--text-dim);" title="Reset views">↺ Reset</button>
        </form>
      </td>
      <td>
        <form method="POST" action="/admin/set-likes" style="display:flex;gap:4px;align-items:center;">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <input type="number" name="likes" value="${v.likes}" min="0" style="width:52px;padding:4px 6px;margin:0;font-size:11px;">
          <input type="number" name="dislikes" value="${v.dislikes}" min="0" style="width:52px;padding:4px 6px;margin:0;font-size:11px;">
          <button type="submit" style="margin:0;padding:4px 7px;font-size:10px;border-radius:4px;">Set</button>
        </form>
        <form method="POST" action="/admin/reset-likes" class="inline-form">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <button type="submit" style="margin-top:4px;padding:3px 7px;font-size:10px;border-radius:4px;background:var(--bg-panel-2);border:1px solid var(--border);color:var(--text-dim);" title="Reset likes & dislikes">↺ Reset</button>
        </form>
      </td>
      <td>${v.purchaseCount}</td>
      <td>
        <a class="edit-btn" href="/admin/edit?id=${encodeURIComponent(v.id)}">Edit</a>
        <a class="edit-btn" href="/admin/comments?id=${encodeURIComponent(v.id)}" style="margin-left:4px;">Comments</a>
        <form method="POST" action="/admin/video-hide-toggle" class="inline-form" style="margin-left:4px;">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <input type="hidden" name="back" value="videos">
          <button class="${v.hidden ? "unban-btn" : "ban-btn"}" type="submit">${v.hidden ? "Unhide" : "Hide"}</button>
        </form>
        <form method="POST" action="/admin/video-draft-toggle" class="inline-form" style="margin-left:4px;">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <input type="hidden" name="back" value="videos">
          <button class="${v.draft ? "unban-btn" : "ban-btn"}" type="submit">${v.draft ? "Publish" : "Save as Draft"}</button>
        </form>
        <form method="POST" action="/admin/soft-delete" class="inline-form" style="margin-left:4px;">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <button class="ban-btn" type="submit" title="Move to Trash">🗑 Trash</button>
        </form>
      </td>
    </tr>`).join("");

  const trashRows = trashedVideos.map(v => `
    <tr>
      <td style="max-width:260px;word-break:break-word;">🎬 ${escapeHtml(v.title)}</td>
      <td>
        <form method="POST" action="/admin/restore" class="inline-form">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <button class="unban-btn" type="submit">Restore</button>
        </form>
        <form method="POST" action="/admin/delete" class="inline-form" style="margin-left:4px;" onsubmit="return dangerConfirm(this, ${JSON.stringify(v.title)})">
          <input type="hidden" name="id" value="${escapeHtml(v.id)}">
          <button class="del-btn" type="submit">Delete permanently</button>
        </form>
      </td>
    </tr>`).join("");

  // Series live in the same conceptual Trash as videos: a soft-deleted series
  // (deleted:true) is hidden everywhere on the live site but can be restored
  // or permanently purged (which also unlinks its videos) from here.
  const activeSeries = seriesList.filter(s => !s.deleted);
  const trashedSeries = seriesList.filter(s => s.deleted);

  const trashSeriesRows = trashedSeries.map(s => `
    <tr>
      <td style="max-width:260px;word-break:break-word;">📺 ${escapeHtml(s.title)} <span class="tag">Series</span></td>
      <td>
        <form method="POST" action="/admin/series-restore" class="inline-form">
          <input type="hidden" name="id" value="${escapeHtml(s.id)}">
          <button class="unban-btn" type="submit">Restore</button>
        </form>
        <form method="POST" action="/admin/series-delete-permanent" class="inline-form" style="margin-left:4px;" onsubmit="return dangerConfirm(this, ${JSON.stringify(s.title)})">
          <input type="hidden" name="id" value="${escapeHtml(s.id)}">
          <button class="del-btn" type="submit">Delete permanently</button>
        </form>
      </td>
    </tr>`).join("");

  // ANALYTICS: real-time active users + per-user stay time / visit details.
  // Refreshed live client-side by the poller injected below, no reload needed.
  const liveViewers = await getOnlineCount(env);
  let analyticsUsers = [];
  let anonOnlineCount = 0, anonVisitsToday = 0, regVisitsToday = 0;
  if (activeTab === "analytics") {
    analyticsUsers = await enrichUsers(env, users);
    analyticsUsers.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    const snap = await getAnalyticsSnapshot(env);
    anonOnlineCount = snap.anonymousOnline;
    anonVisitsToday = snap.anonymousVisitsToday;
    regVisitsToday = snap.registeredVisitsToday;
  }
  const analyticsRows = analyticsUsers.map(u => {
    const online = u.lastSeen && (Date.now() - u.lastSeen) < ONLINE_WINDOW_MS;
    return `
    <tr data-email="${escapeHtml(u.email)}">
      <td>${escapeHtml(u.username)}${u.isPrivate ? ' <span class="tag">Private</span>' : ""}</td>
      <td>${online ? '<span style="color:#7CD98A;font-weight:700;">🟢 Online now</span>' : `<span style="color:var(--text-dim);">⚪ ${u.lastSeen ? timeAgo(new Date(u.lastSeen).toISOString()) : "never seen"}</span>`}</td>
      <td>${u.totalStayMinutes || 0} min lifetime</td>
      <td>${fmtDate(u.lastLoginAt)}<div style="font-size:10.5px;color:var(--text-dim);">IP: ${escapeHtml(u.lastLoginIp || "—")}</div></td>
      <td>💰${u.coins || 0}</td>
    </tr>`;
  }).join("");

  // TRANSACTIONS: full admin log of gifts (incl. reversals) and coin requests.
  // NEW — user filter/dropdown: when txuser is set, only that user's rows show.
  let txRows = "";
  let txUsernameOptions = "";
  const txUserSelected = (txuser || "").toString().trim();
  if (activeTab === "transactions") {
    let txLog = await getTransactionLog(env);
    const TX_TYPE_LABELS = {
      checkin: "Daily check-in", active_time: "Active-time reward", active_streak_bonus: "Streak bonus",
      referral_signup: "Referral signup bonus", referral_commission: "Referral commission",
      admin_credit: "Admin credit", admin_debit: "Admin debit", gift: "Gift",
      purchase: "Video purchase", purchase_series: "Series purchase", download: "Download",
      request_created: "Coin request"
    };
    if (txUserSelected) {
      txLog = txLog.filter(t => t.from === txUserSelected || t.to === txUserSelected);
    }
    txRows = txLog.slice(0, 300).map(t => `
      <tr>
        <td style="font-size:11px;color:var(--text-dim);white-space:nowrap;">${fmtDate(t.time)}</td>
        <td style="font-size:10px;color:var(--text-dim);word-break:break-all;max-width:90px;">${t.id ? escapeHtml(t.id.slice(0, 8)) : "—"}</td>
        <td>${escapeHtml(TX_TYPE_LABELS[t.type] || t.type)}</td>
        <td>${t.from ? "@" + escapeHtml(t.from) : "—"}</td>
        <td>${t.to ? "@" + escapeHtml(t.to) : "—"}</td>
        <td style="color:${t.amount < 0 ? 'var(--danger)' : 'var(--gold)'};white-space:nowrap;">💰${t.amount != null ? t.amount : "—"}</td>
        <td style="font-size:11px;color:var(--text-dim);white-space:nowrap;">${t.balanceBefore != null ? "💰" + t.balanceBefore : "—"}</td>
        <td style="font-size:11px;color:var(--text-dim);white-space:nowrap;">${t.balanceAfter != null ? "💰" + t.balanceAfter : "—"}</td>
        <td>${escapeHtml(t.status || "—")}</td>
        <td style="font-size:11.5px;color:var(--text-dim);max-width:200px;">${escapeHtml(t.note || "—")}${t.videoTitle ? `<div style="margin-top:2px;">🎬 ${escapeHtml(t.videoTitle)}</div>` : ""}</td>
      </tr>`).join("");
    // Build the username dropdown from every user who appears in the log, not
    // just the currently-registered user list, so historical rows (e.g. a
    // since-deleted account) stay filterable too.
    const namesInLog = new Set();
    (await getTransactionLog(env)).forEach(t => { if (t.from) namesInLog.add(t.from); if (t.to) namesInLog.add(t.to); });
    users.forEach(u => { if (u.username) namesInLog.add(u.username); });
    txUsernameOptions = [...namesInLog].sort((a, b) => a.localeCompare(b)).map(n =>
      `<option value="${escapeHtml(n)}" ${txUserSelected === n ? "selected" : ""}>@${escapeHtml(n)}</option>`
    ).join("");
  }

  const catTree = cats.map(c => `
    <div class="sub-cat-tree">
      <div class="sub-cat-row" style="background:var(--bg-panel-2);">
        <span class="sub-cat-label">📁 ${escapeHtml(c.name)} ${c.hidden ? '<span class="tag" style="color:var(--danger);border-color:var(--danger);">Hidden</span>' : '<span class="tag" style="color:#7CD98A;border-color:#3E7A4A;">Visible</span>'}</span>
        <div style="display:flex;gap:6px;">
          <form method="POST" action="/admin/category-toggle-visibility" class="inline-form">
            <input type="hidden" name="category" value="${escapeHtml(c.name)}">
            <button class="${c.hidden ? "unban-btn" : "ban-btn"}" type="submit">${c.hidden ? "Show" : "Hide"}</button>
          </form>
          <form method="POST" action="/admin/category-delete" class="inline-form" onsubmit="return dangerConfirm(this, ${JSON.stringify(c.name)})">
            <input type="hidden" name="category" value="${escapeHtml(c.name)}">
            <button class="del-btn" type="submit">Delete</button>
          </form>
        </div>
      </div>
      ${(c.subs || []).map(s => `
      <div class="sub-cat-row" style="padding-left:32px;">
        <span class="sub-cat-label" style="font-size:12px;color:var(--text-dim);">└ ${escapeHtml(s)}</span>
        <form method="POST" action="/admin/subcategory-delete" class="inline-form">
          <input type="hidden" name="category" value="${escapeHtml(c.name)}">
          <input type="hidden" name="sub" value="${escapeHtml(s)}">
          <button class="del-btn" type="submit">Delete</button>
        </form>
      </div>`).join("")}
      <div class="sub-cat-row">
        <form method="POST" action="/admin/subcategory-add" style="display:flex;gap:8px;flex:1;align-items:center;">
          <input type="hidden" name="category" value="${escapeHtml(c.name)}">
          <input type="text" name="sub" placeholder="Add sub-category..." style="margin:0;padding:6px 10px;font-size:12px;flex:1;">
          <button type="submit" style="margin:0;padding:6px 12px;font-size:12px;border-radius:6px;">Add</button>
        </form>
      </div>
    </div>
  `).join("");

  // Series tab (REVAMPED — Feature: Series Admin Management): collapsible
  // <details> per series. Parts remain shown oldest → newest (upload order
  // still drives ordering/"Part N" labels everywhere — unchanged, per the
  // "do not accidentally break existing series behavior" requirement).
  const seriesRows = activeSeries.map(s => {
    const parts = sortByUploadOrder(activeVideos.filter(v => v.seriesId === s.id));
    return `
    <details class="series-block">
      <summary>
        <div>
          <strong>📺 ${escapeHtml(s.title)}</strong>
          ${s.coinCost > 0 ? `<span class="tag" style="margin-left:6px;">💰${s.coinCost} bundle</span>` : `<span class="tag" style="margin-left:6px;">Free bundle</span>`}
          ${s.hidden ? `<span class="release-pill hidden-pill" style="margin-left:6px;">🚫 Hidden</span>` : `<span class="release-pill visible-pill" style="margin-left:6px;">✓ Visible</span>`}
          <span class="tag" style="margin-left:6px;">${parts.length} part${parts.length === 1 ? "" : "s"}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;" onclick="event.stopPropagation()">
          <a class="edit-btn" href="/admin?tab=add">+ Add part</a>
          <form method="POST" action="/admin/series-hide-toggle" class="inline-form">
            <input type="hidden" name="id" value="${escapeHtml(s.id)}">
            <button class="${s.hidden ? "unban-btn" : "ban-btn"}" type="submit">${s.hidden ? "Unhide series" : "Hide series"}</button>
          </form>
          <form method="POST" action="/admin/series-delete" class="inline-form">
            <input type="hidden" name="id" value="${escapeHtml(s.id)}">
            <button class="ban-btn" type="submit" title="Move to Trash">🗑 Trash series</button>
          </form>
        </div>
      </summary>
      <div class="sub-cat-row" style="flex-wrap:wrap;gap:10px;">
        <form method="POST" action="/admin/series-rename" style="display:flex;gap:8px;flex:1;min-width:220px;align-items:center;">
          <input type="hidden" name="id" value="${escapeHtml(s.id)}">
          <input type="text" name="title" value="${escapeHtml(s.title)}" placeholder="Series title" style="margin:0;flex:1;">
          <button type="submit" style="margin:0;padding:6px 12px;font-size:12px;border-radius:6px;">Rename</button>
        </form>
        <form method="POST" action="/admin/series-coincost" style="display:flex;gap:8px;align-items:center;">
          <input type="hidden" name="id" value="${escapeHtml(s.id)}">
          <input type="number" name="coinCost" min="0" value="${s.coinCost || 0}" placeholder="Bundle price" style="margin:0;padding:6px 10px;font-size:12px;max-width:120px;">
          <button type="submit" style="margin:0;padding:6px 12px;font-size:12px;border-radius:6px;">Update bundle price</button>
        </form>
      </div>
      ${parts.length ? parts.map((p, idx) => `
      <div class="series-part-row">
        <img src="${escapeHtml(p.thumbnail)}" alt="">
        <div style="flex:1;min-width:140px;">
          <div style="font-size:13px;font-weight:600;">Part ${idx + 1}: ${escapeHtml(p.title)}</div>
          <div style="font-size:10.5px;color:var(--text-dim);margin-top:2px;word-break:break-all;">Drive ID: ${escapeHtml(p.driveId)}</div>
          <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;">
            ${p.coinCost > 0 ? `<span class="release-pill">💰${p.coinCost}</span>` : `<span class="release-pill visible-pill">Free</span>`}
            ${p.releaseDate ? `<span class="release-pill">📅 ${escapeHtml(p.releaseDate)}</span>` : ""}
            ${p.hidden ? `<span class="release-pill hidden-pill">🚫 Hidden</span>` : isScheduledFuture(p) ? `<span class="release-pill" style="color:#8AB4F2;border-color:#3A5A8F;">⏰ Scheduled</span>` : `<span class="release-pill visible-pill">✓ Visible</span>`}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <a class="edit-btn" href="/admin/edit?id=${encodeURIComponent(p.id)}">Edit</a>
          <form method="POST" action="/admin/video-hide-toggle" class="inline-form">
            <input type="hidden" name="id" value="${escapeHtml(p.id)}">
            <input type="hidden" name="back" value="series">
            <button class="${p.hidden ? "unban-btn" : "ban-btn"}" type="submit">${p.hidden ? "Unhide" : "Hide"}</button>
          </form>
          <form method="POST" action="/admin/soft-delete" class="inline-form">
            <input type="hidden" name="id" value="${escapeHtml(p.id)}">
            <button class="ban-btn" type="submit" title="Move to Trash">🗑 Trash</button>
          </form>
        </div>
      </div>`).join("") : `<div class="sub-cat-row"><span style="font-size:12px;color:var(--text-dim);">No parts assigned yet — set "Series" when adding/editing a video, or use "+ Add part" above.</span></div>`}
    </details>`;
  }).join("");

  const body = `
    <div class="admin-wrap">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div class="admin-title">🔧 Admin Dashboard</div>
        ${settings.liveAnalyticsEnabled !== false ? `
        <div class="live-viewers-badge" id="liveViewersBadge" title="Users active on the site in the last 45 seconds">
          <span class="lvb-dot"></span> <span id="liveViewersCount">${liveViewers.online}</span> viewer${liveViewers.online === 1 ? "" : "s"} online
        </div>` : ""}
        <a href="/?preview=admin" target="_blank" rel="noopener" class="live-viewers-badge" style="cursor:pointer;text-decoration:none;" title="Preview the live site as a visitor would, with all ads hidden">
          👁 Preview site
        </a>
      </div>
      ${message ? `<div class="msg">${escapeHtml(message)}</div>` : ""}

      <div class="mode-switch-bar">
        <div class="mode-switch-label">
          <strong>Site Mode:</strong>
          ${isFreeMode(settings)
            ? `<span style="color:#7CD98A;font-weight:700;">🟢 FREE MODE</span> — every video is free to watch, coin prices &amp; downloads are hidden from users.`
            : `<span style="color:var(--gold);font-weight:700;">💰 PAID MODE</span> — coin prices are shown, users need a coin balance to watch/download paid videos.`}
        </div>
        <form method="POST" action="/admin/toggle-mode" style="margin:0;">
          <button type="submit" class="mode-toggle-btn ${isFreeMode(settings) ? "is-free" : ""}">
            Switch to ${isFreeMode(settings) ? "💰 Paid Mode" : "🟢 Free Mode"}
          </button>
        </form>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab ${activeTab === "users" ? "active" : ""}" onclick="location.href='/admin?tab=users'">👥 Users (${users.length})</button>
        <button class="admin-tab ${activeTab === "videos" ? "active" : ""}" onclick="location.href='/admin?tab=videos'">🎬 Movies (${standaloneVideos.length})</button>
        <button class="admin-tab ${activeTab === "add" ? "active" : ""}" onclick="location.href='/admin?tab=add'">➕ Add Video</button>
        <button class="admin-tab ${activeTab === "categories" ? "active" : ""}" onclick="location.href='/admin?tab=categories'">📂 Categories</button>
        <button class="admin-tab ${activeTab === "series" ? "active" : ""}" onclick="location.href='/admin?tab=series'">📺 Series (${activeSeries.length})</button>
        <button class="admin-tab ${activeTab === "music" ? "active" : ""}" onclick="location.href='/admin?tab=music'">🎵 Background Music</button>
        <button class="admin-tab ${activeTab === "player" ? "active" : ""}" onclick="location.href='/admin?tab=player'">🎬 Player</button>
        <button class="admin-tab ${activeTab === "trash" ? "active" : ""}" onclick="location.href='/admin?tab=trash'">🗑 Trash (${trashedVideos.length + trashedSeries.length})</button>
        <button class="admin-tab ${activeTab === "analytics" ? "active" : ""}" onclick="location.href='/admin?tab=analytics'">📊 Analytics</button>
        <button class="admin-tab ${activeTab === "transactions" ? "active" : ""}" onclick="location.href='/admin?tab=transactions'">💳 Transactions</button>
        <button class="admin-tab ${activeTab === "access" ? "active" : ""}" onclick="location.href='/admin?tab=access'">🔐 Access Control</button>
        <button class="admin-tab ${activeTab === "settings" ? "active" : ""}" onclick="location.href='/admin?tab=settings'">⚙️ Settings</button>
        <button class="admin-tab ${activeTab === "branding" ? "active" : ""}" onclick="location.href='/admin?tab=branding'">🎨 Branding</button>
        <button class="admin-tab ${activeTab === "ads" ? "active" : ""}" onclick="location.href='/admin?tab=ads'">📢 Ads</button>
        <button class="admin-tab ${activeTab === "achievements" ? "active" : ""}" onclick="location.href='/admin?tab=achievements'">🏆 Achievements</button>
        <button class="admin-tab ${activeTab === "adduser" ? "active" : ""}" onclick="location.href='/admin?tab=adduser'">➕ Add User</button>
        <button class="admin-tab" onclick="location.href='/admin/logout'">🚪 Log out</button>
      </div>

      ${activeTab === "users" ? `
        <table class="users-table">
          <thead><tr><th>Username / Email</th><th>Login Info</th><th>Coins</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${userRows}</tbody>
        </table>
      ` : activeTab === "videos" ? `
        <p class="admin-sub">🎬 Standalone movies only — parts that belong to a series are managed from the 📺 Series tab instead.</p>
        <form method="GET" action="/admin" class="admin-filters">
          <input type="hidden" name="tab" value="videos">
          <div><label style="margin:0 0 4px;">Search</label><input type="text" name="vq" value="${escapeHtml(vq || "")}" placeholder="Search title or category..." style="min-width:220px;"></div>
          <div>
            <label style="margin:0 0 4px;">Sort</label>
            <select name="vsort" onchange="this.form.submit()">
              <option value="newest" ${movieSort === "newest" ? "selected" : ""}>Newest upload</option>
              <option value="oldest" ${movieSort === "oldest" ? "selected" : ""}>Oldest upload</option>
              <option value="release" ${movieSort === "release" ? "selected" : ""}>Newest release date</option>
              <option value="release-old" ${movieSort === "release-old" ? "selected" : ""}>Oldest release date</option>
              <option value="year" ${movieSort === "year" ? "selected" : ""}>Release year</option>
              <option value="title" ${movieSort === "title" ? "selected" : ""}>Title A–Z</option>
              <option value="views" ${movieSort === "views" ? "selected" : ""}>Most viewed</option>
              <option value="hidden" ${movieSort === "hidden" ? "selected" : ""}>Hidden first</option>
            </select>
          </div>
          <button type="submit" style="margin:0;">Apply</button>
        </form>
        <table class="users-table">
          <thead><tr><th>Movie</th><th>Category</th><th>Drive ID</th><th>Coin cost</th><th>Release date</th><th>Year</th><th>Status</th><th>Views</th><th>Likes / Dislikes</th><th>Purchased</th><th>Actions</th></tr></thead>
          <tbody>${videoRows || `<tr><td colspan="10" style="color:var(--text-dim);">No standalone movies found.</td></tr>`}</tbody>
        </table>
      ` : activeTab === "trash" ? `
        <p class="admin-sub">Soft-deleted videos and series are hidden from the site but not gone. Restore them or delete permanently.</p>
        <table class="users-table">
          <thead><tr><th>Item</th><th>Actions</th></tr></thead>
          <tbody>${trashRows}${trashSeriesRows}${(trashRows || trashSeriesRows) ? "" : `<tr><td colspan="2" style="color:var(--text-dim);">Trash is empty.</td></tr>`}</tbody>
        </table>
      ` : activeTab === "analytics" ? (settings.liveAnalyticsEnabled === false ? `
        <div class="mode-switch-bar">
          <div class="mode-switch-label">
            <strong>Live Analytics</strong><br>
            <span style="color:var(--danger);font-weight:700;">🔒 OFF</span> — no real-time viewer counts or live data are being shown while this is off.
          </div>
          <form method="POST" action="/admin/analytics-toggle" style="margin:0;">
            <input type="hidden" name="liveAnalyticsEnabled" value="true">
            <button type="submit" class="mode-toggle-btn is-free">Switch ON</button>
          </form>
        </div>
        <div class="stat-card" style="max-width:480px;text-align:center;padding:32px 20px;margin-top:14px;">
          <div style="font-size:28px;margin-bottom:8px;">🔒</div>
          <div class="num" style="font-size:16px;">Live Analytics is turned off</div>
          <p class="admin-sub" style="margin-top:8px;">No real-time viewer counts or live data are being shown while this is off. Switch it back on above to see everything again.</p>
        </div>
      ` : `
        <div class="mode-switch-bar" style="margin-bottom:14px;">
          <div class="mode-switch-label">
            <strong>Live Analytics</strong><br>
            <span style="color:#7CD98A;font-weight:700;">🟢 ON</span> — real-time viewer counts and live data are visible below.
          </div>
          <form method="POST" action="/admin/analytics-toggle" style="margin:0;">
            <input type="hidden" name="liveAnalyticsEnabled" value="false">
            <button type="submit" class="mode-toggle-btn">Switch OFF</button>
          </form>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span id="liveDot" style="color:#7CD98A;font-weight:700;">🟢 LIVE</span>
          <span style="color:var(--text-dim);font-size:12px;">Last updated <span id="analyticsUpdated">just now</span></span>
        </div>
        <div class="grid-2" style="margin-bottom:14px;">
          <div class="stat-card"><div class="num" id="totalOnlineStat">🟢 ${liveViewers.online + anonOnlineCount}</div><div class="lbl">Online now (all visitors)</div></div>
          <div class="stat-card"><div class="num">${totalUsers}</div><div class="lbl">Total registered users</div></div>
        </div>
        <div class="grid-2" style="margin-bottom:14px;">
          <div class="stat-card">
            <div class="num" id="regOnlineStat">👤 ${liveViewers.online}</div>
            <div class="lbl">Registered — online now</div>
            <div style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">Visits today: <span id="regVisitsStat">${regVisitsToday}</span></div>
          </div>
          <div class="stat-card">
            <div class="num" id="anonOnlineStat">👻 ${anonOnlineCount}</div>
            <div class="lbl">Anonymous / guest — online now</div>
            <div style="font-size:11.5px;color:var(--text-dim);margin-top:4px;">Visits today: <span id="anonVisitsStat">${anonVisitsToday}</span></div>
          </div>
        </div>
        <p class="admin-sub">Registered and anonymous/unknown visitors are tracked separately. Anonymous visitors are identified only by a temporary, non-personal visitor id (no account, no email) and drop off "online" automatically ~60s after their last heartbeat — no manual pruning needed. Per-user rows below cover registered accounts only; reload the page for the freshest rows, the cards above stay live via polling.</p>
        <table class="users-table">
          <thead><tr><th>Username</th><th>Presence</th><th>Active time</th><th>Last login</th><th>Coins</th></tr></thead>
          <tbody id="analyticsBody">${analyticsRows || `<tr><td colspan="5" style="color:var(--text-dim);">No users yet.</td></tr>`}</tbody>
        </table>
        <script>
        (function(){
          async function pollAnalytics(){
            try {
              const res = await fetch('/api/admin/analytics-live', { credentials: 'same-origin' });
              if (!res.ok) return;
              const d = await res.json();
              var el;
              if ((el = document.getElementById('totalOnlineStat'))) el.textContent = '🟢 ' + d.totalOnline;
              if ((el = document.getElementById('regOnlineStat'))) el.textContent = '👤 ' + d.registeredOnline;
              if ((el = document.getElementById('anonOnlineStat'))) el.textContent = '👻 ' + d.anonymousOnline;
              if ((el = document.getElementById('regVisitsStat'))) el.textContent = d.registeredVisitsToday;
              if ((el = document.getElementById('anonVisitsStat'))) el.textContent = d.anonymousVisitsToday;
              if ((el = document.getElementById('analyticsUpdated'))) el.textContent = new Date(d.updatedAt).toLocaleTimeString();
            } catch(e) {}
          }
          pollAnalytics();
          setInterval(pollAnalytics, 8000);
        })();
        </script>
      `) : activeTab === "transactions" ? `
        <p class="admin-sub">Full audit trail of every coin movement — check-ins, active-time rewards, referral bonuses, gifts, purchases, downloads, and admin balance edits. Most recent first.</p>
        <form method="GET" action="/admin" class="admin-filters">
          <input type="hidden" name="tab" value="transactions">
          <div>
            <label style="margin:0 0 4px;">Select User</label>
            <select name="txuser" onchange="this.form.submit()" style="min-width:200px;">
              <option value="">All Users</option>
              ${txUsernameOptions}
            </select>
          </div>
          ${txUserSelected ? `<a class="edit-btn" href="/admin?tab=transactions">Clear filter</a>` : ""}
        </form>
        <table class="users-table">
          <thead><tr><th>Time</th><th>Tx ID</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Balance Before</th><th>Balance After</th><th>Status</th><th>Description / Related</th></tr></thead>
          <tbody>${txRows || `<tr><td colspan="10" style="color:var(--text-dim);">No transactions logged yet.</td></tr>`}</tbody>
        </table>
      ` : activeTab === "access" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">🔐 Access Control</h3>
          <p class="admin-sub">Controls whether a visitor must create/log in to an account before accessing account-required content. This does not change what's free vs. paid — existing coin, purchase, and download rules always still apply.</p>
          <div class="mode-switch-bar">
            <div class="mode-switch-label">
              <strong>Account Required</strong><br>
              ${isAccountRequired(settings)
                ? `<span style="color:var(--gold);font-weight:700;">ON</span> — Users must have an account to access account-required functionality.`
                : `<span style="color:#7CD98A;font-weight:700;">🟢 OFF</span> — Guest access enabled. Visitors can browse and watch eligible free content without an account.`}
            </div>
            <form method="POST" action="/admin/access-control" onsubmit="return confirm('Changing this setting changes whether visitors must create an account to access eligible content. Continue?');" style="margin:0;">
              <input type="hidden" name="accountRequired" value="${isAccountRequired(settings) ? "false" : "true"}">
              <button type="submit" class="mode-toggle-btn ${isAccountRequired(settings) ? "" : "is-free"}">
                Switch ${isAccountRequired(settings) ? "OFF" : "ON"}
              </button>
            </form>
          </div>
          <p class="admin-sub">When OFF, guests can browse the catalogue and watch whatever is already free (free-mode videos, or individual videos priced at 💰0) without logging in — exactly like a logged-in user would see it. Paid videos, downloads, coins, purchases, watch history, notifications, friends, and every other account-specific feature still require a real account either way. Turning this OFF never deletes data, and turning it back ON simply resumes enforcing login for everyone — no existing users or guest analytics are affected.</p>
        </div>
      ` : activeTab === "settings" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">Site settings</h3>
          <p class="admin-sub">Use the Site Mode switch above to flip between Paid and Free instantly. The fields below control coin amounts used while in Paid Mode.</p>
          <form method="POST" action="/admin/settings">
            <label>Download cost (coins)</label>
            <input type="number" name="downloadCost" min="0" value="${settings.downloadCost}">
            <label>Referral signup bonus (coins, given to both users)</label>
            <input type="number" name="referralSignupBonus" min="0" value="${settings.referralSignupBonus}">
            <label>Referral purchase commission (coins to referrer per referred purchase)</label>
            <input type="number" name="referralPurchaseCommission" min="0" value="${settings.referralPurchaseCommission}">
            <label>Daily check-in reward (coins)</label>
            <input type="number" name="dailyCheckinCoins" min="0" value="${settings.dailyCheckinCoins}">
            <label>Active-time threshold for base reward (minutes)</label>
            <input type="number" name="activeTimeThresholdMinutes" min="1" value="${settings.activeTimeThresholdMinutes}">
            <label>Active-time base reward (coins)</label>
            <input type="number" name="activeTimeBaseCoins" min="0" value="${settings.activeTimeBaseCoins}">
            <label>Extra chunk size after threshold (minutes)</label>
            <input type="number" name="activeTimeChunkMinutes" min="1" value="${settings.activeTimeChunkMinutes}">
            <label>Extra chunk reward (coins)</label>
            <input type="number" name="activeTimeChunkCoins" min="0" value="${settings.activeTimeChunkCoins}">
            <label>Daily active-time cap (minutes) — stops counting/rewarding after this many minutes/day</label>
            <input type="number" name="activeTimeDailyCapMinutes" min="1" value="${settings.activeTimeDailyCapMinutes}">
            <label>Check-in streak bonus interval (days)</label>
            <input type="number" name="checkinStreakIntervalDays" min="0" value="${settings.checkinStreakIntervalDays}">
            <label>Check-in streak bonus (coins, awarded every interval)</label>
            <input type="number" name="checkinStreakBonusCoins" min="0" value="${settings.checkinStreakBonusCoins}">
            <label>Gift Reverse Window</label>
            <select name="giftReverseWindowMinutes">
              ${[60, 360, 720, 1440].map(m => `<option value="${m}" ${settings.giftReverseWindowMinutes === m ? "selected" : ""}>${m < 60 ? m + " minutes" : (m / 60) + " hour" + (m / 60 === 1 ? "" : "s")}</option>`).join("")}
            </select>
            <label>New-user starting coin balance (used by Complete Account Reset)</label>
            <input type="number" name="newUserStartingCoins" min="0" value="${settings.newUserStartingCoins}">
            <p class="admin-sub" style="margin-top:2px;">Live Analytics on/off has moved to the 📊 Analytics tab.</p>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;margin-top:14px;">
              <input type="checkbox" name="showReleaseDate" ${settings.showReleaseDate ? "checked" : ""} style="width:auto;margin:0;"> Show Release Date on Website (movie cards &amp; watch pages)
            </label>
            <p class="admin-sub" style="margin:4px 0 0;">This is purely a display setting — release-date sorting, availability, and purchases keep working the same either way.</p>
            <button type="submit">Save settings</button>
          </form>

          <div style="margin-top:32px;border-top:1px solid var(--border);padding-top:20px;">
            <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">🔐 Google Sign-In</h3>
            <p class="admin-sub">Tamizh Zora logs users in with Google only. Create an OAuth 2.0 Client ID in the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:var(--gold);">Google Cloud Console</a> (Web application type) and set its Authorized redirect URI to <code>&lt;your-site-url&gt;/auth/google/callback</code>. Paste the credentials below.</p>
            <form method="POST" action="/admin/settings">
              <input type="hidden" name="_section" value="google">
              <label>Google Client ID</label>
              <input type="text" name="googleClientId" placeholder="xxxxxxxx.apps.googleusercontent.com" value="${escapeHtml(settings.googleClientId || "")}">
              <label>Google Client Secret</label>
              <input type="text" name="googleClientSecret" placeholder="GOCSPX-..." value="${escapeHtml(settings.googleClientSecret || "")}" style="-webkit-text-security:disc;">
              <button type="submit">Save Google credentials</button>
            </form>
            <p class="admin-sub" style="margin-top:8px;">Note: these are stored in the site's key-value store. For production, prefer setting them as encrypted Worker secrets instead and reading from <code>env</code> — this admin form is provided for convenience.</p>
          </div>

          <div style="margin-top:32px;border-top:1px solid var(--border);padding-top:20px;">
            <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;color:var(--danger);">⚠️ Danger zone</h3>
            <p class="admin-sub">Forces every logged-in user's browser to clear its saved local data (watch later list, resume positions, device id) on their next page load. Use this after a major migration or if you suspect abuse.</p>
            <form method="POST" action="/admin/reset-all-local" onsubmit="return dangerConfirm(this, 'RESET ALL')">
              <button type="submit" class="ban-btn" style="padding:11px 20px;font-size:13px;">Reset ALL users' local data</button>
            </form>
          </div>
        </div>
      ` : activeTab === "branding" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">🎨 Site Branding</h3>
          <p class="admin-sub">Everything here is purely cosmetic/metadata — it never touches auth, coins, sorting, or stored video data. Changes apply site-wide (header, footer, titles, SEO/social sharing, PWA) as soon as you save.</p>
          <form method="POST" action="/admin/branding">

            <h4 style="margin:22px 0 6px;color:var(--gold);">Brand</h4>
            <label>Site Name</label>
            <input type="text" name="siteName" maxlength="60" value="${escapeHtml(settings.siteName)}" placeholder="TAMIZH ZORA">
            <label>Short Site Name (mobile/PWA)</label>
            <input type="text" name="shortName" maxlength="20" value="${escapeHtml(settings.shortName || "")}" placeholder="Falls back to Site Name">
            <label>Site Logo (image URL or Google Drive file ID)</label>
            <input type="text" name="siteLogo" maxlength="500" value="${escapeHtml(settings.siteLogo || "")}" placeholder="https://... or Drive file ID">
            ${settings.siteLogoHref ? `<img src="${escapeHtml(settings.siteLogoHref)}" alt="Logo preview" style="height:36px;max-width:220px;object-fit:contain;margin-top:6px;display:block;">` : ""}
            <label>Mobile Logo (optional — falls back to Site Logo)</label>
            <input type="text" name="mobileLogo" maxlength="500" value="${escapeHtml(settings.mobileLogo || "")}" placeholder="https://... or Drive file ID">
            <label>Favicon (image URL or Drive file ID)</label>
            <input type="text" name="faviconUrl" maxlength="500" value="${escapeHtml(settings.faviconUrl || "")}" placeholder="https://... or Drive file ID">
            ${settings.faviconHref ? `<img src="${escapeHtml(settings.faviconHref)}" alt="Favicon preview" style="height:24px;width:24px;object-fit:contain;margin-top:6px;display:block;">` : ""}
            <label>Site Description</label>
            <textarea name="siteDescription" maxlength="300" placeholder="Watch movies, discover upcoming releases and enjoy premium content.">${escapeHtml(settings.siteDescription || "")}</textarea>

            <h4 style="margin:22px 0 6px;color:var(--gold);">Browser / SEO</h4>
            <label>Default Browser Title</label>
            <input type="text" name="browserTitle" maxlength="80" value="${escapeHtml(settings.browserTitle)}" placeholder="TAMIZH ZORA — Watch Movies Online">
            <label>SEO Title (overrides Browser Title in meta/social tags)</label>
            <input type="text" name="seoTitle" maxlength="80" value="${escapeHtml(settings.seoTitle || "")}">
            <label>SEO Description (overrides Site Description in meta/social tags)</label>
            <textarea name="seoDescription" maxlength="300">${escapeHtml(settings.seoDescription || "")}</textarea>
            <label>SEO Keywords (comma-separated)</label>
            <input type="text" name="seoKeywords" maxlength="300" value="${escapeHtml(settings.seoKeywords || "")}" placeholder="movies, streaming, watch online">
            <label>Site URL</label>
            <input type="url" name="siteUrl" maxlength="500" value="${escapeHtml(settings.siteUrl || "")}" placeholder="https://example.com">
            <label>Canonical URL (overrides Site URL)</label>
            <input type="url" name="canonicalUrl" maxlength="500" value="${escapeHtml(settings.canonicalUrl || "")}">
            <label>Default Open Graph Image (URL or Drive file ID)</label>
            <input type="text" name="ogImage" maxlength="500" value="${escapeHtml(settings.ogImage || "")}">
            ${settings.ogImageHref ? `<img src="${escapeHtml(settings.ogImageHref)}" alt="OG image preview" style="max-height:80px;max-width:220px;object-fit:contain;margin-top:6px;display:block;">` : ""}

            <h4 style="margin:22px 0 6px;color:var(--gold);">Theme</h4>
            <label>Default Theme (for visitors with no saved preference)</label>
            <select name="defaultTheme">
              <option value="dark" ${settings.defaultTheme === "dark" ? "selected" : ""}>Dark</option>
              <option value="light" ${settings.defaultTheme === "light" ? "selected" : ""}>Light</option>
              <option value="system" ${settings.defaultTheme === "system" ? "selected" : ""}>System</option>
            </select>
            <label>Accent Color</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" name="accentColor" value="${escapeHtml(settings.accentColor)}" style="width:56px;height:38px;padding:2px;">
              <span style="width:22px;height:22px;border-radius:50%;background:${escapeHtml(settings.accentColor)};border:1px solid var(--border);display:inline-block;"></span>
            </div>
            <label>PWA Theme Color (falls back to Accent Color)</label>
            <input type="color" name="pwaThemeColor" value="${escapeHtml(settings.pwaThemeColor || settings.accentColor)}" style="width:56px;height:38px;padding:2px;">
            <label>PWA Background Color</label>
            <input type="color" name="pwaBackgroundColor" value="${escapeHtml(settings.pwaBackgroundColor)}" style="width:56px;height:38px;padding:2px;">

            <h4 style="margin:22px 0 6px;color:var(--gold);">Footer</h4>
            <label>Footer Text</label>
            <textarea name="footerText" maxlength="400">${escapeHtml(settings.footerText || "")}</textarea>
            <label>Copyright Text</label>
            <input type="text" name="copyrightText" maxlength="200" value="${escapeHtml(settings.copyrightText || "")}" placeholder="© 2026 TAMIZH ZORA. All rights reserved.">
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="autoCopyrightYear" ${settings.autoCopyrightYear !== false ? "checked" : ""} style="width:auto;margin:0;"> Automatically use the current year in the copyright line
            </label>
            <p class="admin-sub" style="margin:4px 0 0;">Preview: <strong>${escapeHtml((settings.autoCopyrightYear !== false ? (settings.copyrightText || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`).replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`) : (settings.copyrightText || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`)))}</strong></p>

            <h4 style="margin:22px 0 6px;color:var(--gold);">Social Links</h4>
            <label>Facebook</label>
            <input type="url" name="social_facebook" maxlength="500" value="${escapeHtml(settings.socialLinks.facebook || "")}" placeholder="https://facebook.com/...">
            <label>Instagram</label>
            <input type="url" name="social_instagram" maxlength="500" value="${escapeHtml(settings.socialLinks.instagram || "")}" placeholder="https://instagram.com/...">
            <label>YouTube</label>
            <input type="url" name="social_youtube" maxlength="500" value="${escapeHtml(settings.socialLinks.youtube || "")}" placeholder="https://youtube.com/...">
            <label>Telegram</label>
            <input type="url" name="social_telegram" maxlength="500" value="${escapeHtml(settings.socialLinks.telegram || "")}" placeholder="https://t.me/...">
            <label>X / Twitter</label>
            <input type="url" name="social_twitter" maxlength="500" value="${escapeHtml(settings.socialLinks.twitter || "")}" placeholder="https://x.com/...">

            <h4 style="margin:22px 0 6px;color:var(--gold);">Header Announcement</h4>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="announcementEnabled" ${settings.announcementEnabled ? "checked" : ""} style="width:auto;margin:0;"> Show announcement bar at the top of every page
            </label>
            <label>Announcement Text</label>
            <input type="text" name="announcementText" maxlength="200" value="${escapeHtml(settings.announcementText || "")}" placeholder="🎬 New movies added!">
            <label>Announcement Link (optional)</label>
            <input type="url" name="announcementUrl" maxlength="500" value="${escapeHtml(settings.announcementUrl || "")}">
            ${settings.announcementEnabled && settings.announcementText ? `<div style="margin-top:8px;">${announcementHtml(settings)}</div>` : ""}

            <h4 style="margin:22px 0 6px;color:var(--gold);">PWA</h4>
            <label>App Name (falls back to Site Name)</label>
            <input type="text" name="pwaName" maxlength="60" value="${escapeHtml(settings.pwaName || "")}">
            <label>Short App Name (falls back to Short Site Name)</label>
            <input type="text" name="pwaShortName" maxlength="20" value="${escapeHtml(settings.pwaShortName || "")}">
            <label>App Icon (URL or Drive file ID — falls back to Site Logo/Favicon)</label>
            <input type="text" name="pwaIcon" maxlength="500" value="${escapeHtml(settings.pwaIcon || "")}">

            <div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap;">
              <button type="submit">Save Branding</button>
              <button type="button" class="ban-btn" style="background:transparent;color:var(--text-dim);border:1px solid var(--border);" onclick="location.href='/admin?tab=branding'">Reset (discard changes)</button>
            </div>
          </form>
          <form method="POST" action="/admin/branding/reset-defaults" onsubmit="return dangerConfirm(this, 'RESET BRANDING')" style="margin-top:14px;">
            <button type="submit" class="ban-btn" style="padding:9px 16px;font-size:12.5px;">Reset ALL branding to defaults</button>
          </form>
        </div>
      ` : activeTab === "ads" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">📢 Ads Management</h3>
          <p class="admin-sub">Your existing ad is preserved and shown below. Add more, set placement/priority, or disable any of them.</p>
          <table class="users-table">
            <thead><tr><th>Name</th><th>Type</th><th>Placement</th><th>Priority</th><th>Status</th><th>Created</th><th>Updated</th><th>Preview</th><th>Actions</th></tr></thead>
            <tbody>${adRows}</tbody>
          </table>
          <div style="margin-top:22px;max-width:560px;">
            <h4>➕ Add Ad</h4>
            <form method="POST" action="/admin/ads/save">
              <label>Ad name</label>
              <input type="text" name="name" required placeholder="e.g. Homepage Banner">
              <label>Type</label>
              <select name="type"><option value="html">HTML / Script</option><option value="image">Image banner</option></select>
              <label>Ad code (HTML/JS or image URL)</label>
              <textarea name="code" rows="4" placeholder="&lt;script&gt;...&lt;/script&gt; or an image URL"></textarea>
              <label>Placement</label>
              <select name="placement">${AD_PLACEMENTS.map(p => `<option value="${p}">${p}</option>`).join("")}</select>
              <label>Priority (higher shows first)</label>
              <input type="number" name="priority" value="0">
              <label>Start date (optional)</label>
              <input type="date" name="startDate">
              <label>End date (optional)</label>
              <input type="date" name="endDate">
              <button type="submit" class="ban-btn" style="padding:9px 16px;font-size:12.5px;">Save Ad</button>
            </form>
          </div>

          <div style="margin-top:32px;border-top:1px solid var(--border);padding-top:20px;max-width:560px;">
            <h4>🛡️ Ad Blocker Protection</h4>
            <p class="admin-sub">When enabled, visitors running an ad blocker see a message asking them to disable it. Off by default.</p>
            <form method="POST" action="/admin/adblock/save">
              <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
                <input type="checkbox" name="adBlockProtectionEnabled" ${settings.adBlockProtectionEnabled ? "checked" : ""} style="width:auto;margin:0;"> Enable Ad Blocker Detection
              </label>
              <label style="margin-top:10px;">Message shown to visitors with an ad blocker on</label>
              <textarea name="adBlockProtectionMessage" rows="3" maxlength="500">${escapeHtml(settings.adBlockProtectionMessage || "")}</textarea>
              <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;margin-top:10px;">
                <input type="checkbox" name="adBlockProtectionDismissible" ${settings.adBlockProtectionDismissible !== false ? "checked" : ""} style="width:auto;margin:0;"> Allow visitors to dismiss and keep browsing (uncheck for a hard wall)
              </label>
              <button type="submit" class="ban-btn" style="padding:9px 16px;font-size:12.5px;margin-top:10px;">Save Ad Blocker Settings</button>
            </form>
          </div>
        </div>
      ` : activeTab === "achievements" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">🏆 Achievements / Daily Tasks</h3>
          <p class="admin-sub">One-time lifetime-milestone rewards (separate from the recurring Daily Check-in / Active-Time rewards under ⚙️ Settings). Off by default — turn on below, then tune or add milestones.</p>
          <form method="POST" action="/admin/achievements/save">
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="achievementsEnabled" ${settings.achievementsEnabled ? "checked" : ""} style="width:auto;margin:0;"> Enable Achievements for all users
            </label>
            <table class="users-table" style="margin-top:16px;">
              <thead><tr><th>On</th><th>Name</th><th>Description</th><th>Stat</th><th>Threshold</th><th>Reward (coins)</th></tr></thead>
              <tbody>
                ${achievementCatalog.map((a, i) => `
                <tr>
                  <td><input type="checkbox" name="ach_${i}_enabled" ${a.enabled !== false ? "checked" : ""} style="width:auto;"></td>
                  <td><input type="text" name="ach_${i}_label" value="${escapeHtml(a.label)}" style="min-width:140px;" required>
                    <input type="hidden" name="ach_${i}_id" value="${escapeHtml(a.id)}"></td>
                  <td><input type="text" name="ach_${i}_description" value="${escapeHtml(a.description || "")}" style="min-width:200px;"></td>
                  <td>
                    <select name="ach_${i}_stat">
                      ${ACHIEVEMENT_STATS.map(s => `<option value="${s.key}" ${a.stat === s.key ? "selected" : ""}>${s.label}</option>`).join("")}
                    </select>
                  </td>
                  <td><input type="number" name="ach_${i}_threshold" value="${a.threshold}" min="0" step="any" style="width:90px;"></td>
                  <td><input type="number" name="ach_${i}_coins" value="${a.coins}" min="0" style="width:80px;"></td>
                </tr>`).join("")}
              </tbody>
            </table>
            <input type="hidden" name="ach_count" value="${achievementCatalog.length}">
            <p class="admin-sub" style="margin-top:10px;">To add a new milestone, duplicate a row's idea: increase "ach_count" isn't needed here — use the ➕ Add row button below, then Save.</p>
            <button type="button" class="ban-btn" style="padding:8px 14px;font-size:12.5px;margin-top:6px;" onclick="addAchievementRow()">➕ Add achievement row</button>
            <button type="submit" style="margin-top:14px;">Save Achievements</button>
          </form>
          <p class="admin-sub" style="margin-top:16px;">Suggested stats you can build milestones from: total hours watched, daily check-in streak, friends referred, videos/series unlocked, and reviews written. Users are notified and credited automatically the moment they cross a threshold — no manual work needed.</p>
        </div>
        <script>
          function addAchievementRow() {
            var i = document.querySelectorAll('table.users-table tbody tr').length;
            var statsOptions = ${JSON.stringify(ACHIEVEMENT_STATS)};
            var optHtml = statsOptions.map(function(s){ return '<option value="' + s.key + '">' + s.label + '</option>'; }).join('');
            var tr = document.createElement('tr');
            tr.innerHTML = '<td><input type="checkbox" name="ach_' + i + '_enabled" checked style="width:auto;"></td>' +
              '<td><input type="text" name="ach_' + i + '_label" placeholder="New Achievement" style="min-width:140px;" required>' +
              '<input type="hidden" name="ach_' + i + '_id" value="custom_' + Date.now() + '"></td>' +
              '<td><input type="text" name="ach_' + i + '_description" placeholder="Description" style="min-width:200px;"></td>' +
              '<td><select name="ach_' + i + '_stat">' + optHtml + '</select></td>' +
              '<td><input type="number" name="ach_' + i + '_threshold" value="1" min="0" step="any" style="width:90px;"></td>' +
              '<td><input type="number" name="ach_' + i + '_coins" value="10" min="0" style="width:80px;"></td>';
            var table = document.querySelector('table.users-table');
            table.querySelector('tbody').appendChild(tr);
            document.querySelector('input[name="ach_count"]').value = i + 1;
          }
        </script>
      ` : activeTab === "add" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">Add a new video</h3>
          <form method="POST" action="/admin/add">
            <label>Title</label>
            <input type="text" name="title" required placeholder="e.g. Summer Trip 2026 — Part 1">
            <label>Google Drive File ID</label>
            <input type="text" name="driveId" required placeholder="1A2B3C4D5E6F7G8H9I0J">
            <label>Thumbnail Image URL</label>
            <input type="text" name="thumbnail" required placeholder="https://...">
            <label>Duration (optional)</label>
            <input type="text" name="duration" placeholder="e.g. 1:45:00">
            <label>Coin cost to unlock (0 = free)</label>
            <input type="number" name="coinCost" min="0" value="5">
            <label>Category</label>
            <select name="category">
              <option value="">— None —</option>
              ${cats.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}
            </select>
            <label>Sub-category (optional)</label>
            <input type="text" name="subCategory" placeholder="e.g. Vlogs, Tutorials">
            <label>Series (optional — for multi-part uploads like Part 1, Part 2...)</label>
            <select name="seriesId">
              <option value="">— Not part of a series —</option>
              ${activeSeries.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`).join("")}
            </select>
            <label>Part number (legacy — display order now follows upload date)</label>
            <input type="number" name="part" min="1" value="1">
            <label>Publish date/time (leave blank to publish immediately)</label>
            <input type="datetime-local" name="publishAt">
            <label>Release Date (NEW — the movie's actual displayed release date; separate from Publish date/time above)</label>
            <input type="date" name="releaseDate">
            <label>Description (optional)</label>
            <textarea name="description" placeholder="What's this video about?"></textarea>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;margin-top:14px;">
              <input type="checkbox" name="draft" style="width:auto;margin:0;"> Save as Draft (hidden from everyone until you publish it — direct links are blocked too, only admins can preview it)
            </label>
            <button type="submit">Add video</button>
          </form>
        </div>
      ` : activeTab === "series" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">Video Series (multi-part packs)</h3>
          <p class="admin-sub">Create a series here, then choose it in the Series dropdown when adding/editing a video. Parts are always shown oldest → newest by upload date — the first video you upload into a series becomes Part 1, the second becomes Part 2, and so on, both here and on the watch page. Set a bundle price so users can unlock all parts at once, or leave it at 0 for a free series. "Trash series" moves it to the Trash tab instead of deleting it right away.</p>
          <form method="POST" action="/admin/series-add" style="display:flex;gap:10px;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;">
            <div style="flex:1;min-width:200px;">
              <label>New series title</label>
              <input type="text" name="title" placeholder="e.g. Summer Trip 2026" style="margin:0;">
            </div>
            <button type="submit" style="margin:0;margin-bottom:10px;">Create series</button>
          </form>
          ${seriesRows || `<div class="empty"><p>No series yet. Create one above.</p></div>`}
        </div>
      ` : activeTab === "music" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">🎵 Background Music</h3>
          <p class="admin-sub">Configure the site's background music track — plays for normal browsing pages only (Home, Profile, Check-in, Claimed, Watch Later). It always stops while a movie is open and reuses the same Google Drive proxy as videos, so no extra credentials are exposed.</p>
          <div class="grid-2" style="margin-bottom:16px;max-width:420px;">
            <div class="stat-card"><div class="num" style="font-size:18px;">${settings.backgroundMusic.enabled ? '🟢 Enabled' : '⚪ Disabled'}</div><div class="lbl">Current status</div></div>
            <div class="stat-card"><div class="num" style="font-size:18px;">${settings.backgroundMusic.autoplay ? '▶️ On' : '🔇 Off'}</div><div class="lbl">Autoplay on load</div></div>
          </div>
          <form method="POST" action="/admin/music-settings">
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="enabled" ${settings.backgroundMusic.enabled ? "checked" : ""} style="width:auto;margin:0;"> Enable background music
            </label>
            <label>Music title</label>
            <input type="text" name="title" value="${escapeHtml(settings.backgroundMusic.title || "")}" placeholder="e.g. Tamizh Zora Lounge Mix">
            <label>Google Drive MP3 File ID</label>
            <input type="text" name="driveId" value="${escapeHtml(settings.backgroundMusic.driveId || "")}" placeholder="1A2B3C4D5E6F7G8H9I0J">
            <label>Volume (0.0 – 1.0)</label>
            <input type="number" name="volume" min="0" max="1" step="0.05" value="${settings.backgroundMusic.volume}">
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="loop" ${settings.backgroundMusic.loop ? "checked" : ""} style="width:auto;margin:0;"> Loop continuously
            </label>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="autoplay" ${settings.backgroundMusic.autoplay ? "checked" : ""} style="width:auto;margin:0;"> Autoplay on page load
            </label>
            <p style="font-size:12px;color:var(--text-dim);margin:-4px 0 10px;">When on, music starts as soon as a page loads (subject to the browser's autoplay rules — most browsers still require one click/tap somewhere on the site before any sound can play, even with this on). When off, the track is loaded and ready but only starts once the visitor taps the 🔊 button themselves.</p>
            <button type="submit">Save music settings</button>
          </form>
          ${settings.backgroundMusic.driveId ? `
          <div style="margin-top:24px;">
            <div class="section-head" style="margin-top:0;">Preview / test current track</div>
            <audio controls style="width:100%;max-width:420px;" src="${escapeHtml(await buildSignedSrc(env.DRIVE_PROXY_BASE, settings.backgroundMusic.driveId, env.LINK_SECRET))}"></audio>
          </div>` : ""}
        </div>
      ` : activeTab === "player" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">🎬 Player</h3>
          <p class="admin-sub">Controls the "Reel" video player used on every /watch page — the film-reel skin, custom controls, keyboard shortcuts, and simulated pre-roll/mid-roll ad breaks. Everything here applies site-wide, immediately, to every video.</p>
          <div class="grid-2" style="margin-bottom:16px;max-width:420px;">
            <div class="stat-card"><div class="num" style="font-size:18px;">${settings.player.adsEnabled ? '🟢 On' : '⚪ Off'}</div><div class="lbl">Ad breaks</div></div>
            <div class="stat-card"><div class="num" style="font-size:18px;">${settings.player.keyboardShortcuts !== false ? '⌨️ On' : '⚪ Off'}</div><div class="lbl">Keyboard shortcuts</div></div>
          </div>
          <form method="POST" action="/admin/player-settings">
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="adsEnabled" ${settings.player.adsEnabled ? "checked" : ""} style="width:auto;margin:0;"> Enable ad breaks (pre-roll + mid-roll)
            </label>
            <p style="font-size:12px;color:var(--text-dim);margin:-4px 0 10px;">This is a simulated ad slate rendered client-side — a placeholder "Advertisement" screen with a countdown and skip button, not a real ad network. Swap in a VAST tag or your own ad creative later if you need real monetization.</p>

            <label>Pre-roll length (seconds)</label>
            <input type="number" name="prerollSeconds" min="1" max="120" value="${settings.player.prerollSeconds}">
            <label>Mid-roll length (seconds)</label>
            <input type="number" name="midrollSeconds" min="1" max="120" value="${settings.player.midrollSeconds}">
            <label>Mid-roll trigger point (% into the video)</label>
            <input type="number" name="midrollAtPercent" min="1" max="99" value="${settings.player.midrollAtPercent}">
            <label>"Skip ad" appears after (seconds)</label>
            <input type="number" name="skipAfterSeconds" min="0" max="60" value="${settings.player.skipAfterSeconds}">
            <label>Ad headline text</label>
            <input type="text" name="adHeadline" value="${escapeHtml(settings.player.adHeadline || "")}" placeholder="Advertisement">
            <label>Ad subtext</label>
            <input type="text" name="adSubtext" value="${escapeHtml(settings.player.adSubtext || "")}" placeholder="Your video resumes automatically">

            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;margin-top:14px;">
              <input type="checkbox" name="keyboardShortcuts" ${settings.player.keyboardShortcuts !== false ? "checked" : ""} style="width:auto;margin:0;"> Keyboard shortcuts (space, arrows, M, F)
            </label>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="reelAnimation" ${settings.player.reelAnimation !== false ? "checked" : ""} style="width:auto;margin:0;"> Spinning film-reel decoration
            </label>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="showSpeedControl" ${settings.player.showSpeedControl !== false ? "checked" : ""} style="width:auto;margin:0;"> Playback speed control
            </label>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="resumePlayback" ${settings.player.resumePlayback !== false ? "checked" : ""} style="width:auto;margin:0;"> Remember playback position (resume where left off)
            </label>
            <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
              <input type="checkbox" name="autoNextDefault" ${settings.player.autoNextDefault !== false ? "checked" : ""} style="width:auto;margin:0;"> "Auto next" checked by default
            </label>
            <button type="submit" style="margin-top:14px;">Save player settings</button>
          </form>
        </div>
      ` : activeTab === "adduser" ? `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">Add a new user</h3>
          <form method="POST" action="/admin/user-add">
            <label>Full Name</label>
            <input type="text" name="name" required placeholder="Full Name">
            <label>Username</label>
            <input type="text" name="username" required placeholder="username">
            <label>Email</label>
            <input type="email" name="email" required placeholder="user@email.com">
            <label>Password</label>
            <input type="text" name="password" required placeholder="Set password" style="-webkit-text-security:disc;">
            <label>Starting Coins</label>
            <input type="number" name="coins" value="50" min="0">
            <button type="submit">Create user</button>
          </form>
        </div>
      ` : `
        <div>
          <h3 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;">Manage Categories &amp; Sub-categories</h3>
          <form method="POST" action="/admin/categories" style="display:flex;gap:10px;align-items:flex-end;margin-bottom:24px;">
            <div style="flex:1;">
              <label>Add new top-level category</label>
              <input type="text" name="category" placeholder="e.g. Documentary, Comedy" style="margin:0;">
            </div>
            <button type="submit" style="margin:0;margin-bottom:10px;">Add</button>
          </form>
          ${catTree || `<div class="empty"><p>No categories yet. Add one above.</p></div>`}
        </div>
      `}
    </div>
    <script>
      // Real-time viewer count: polls a lightweight endpoint every 10s so the
      // admin always sees an up-to-date "who's on the site right now" figure
      // without reloading, on every tab (not just Analytics).
      async function pollLiveViewers() {
        try {
          const res = await fetch('/admin/api/live-viewers', { credentials: 'same-origin' });
          if (!res.ok) return;
          const data = await res.json();
          document.querySelectorAll('#liveViewersCount').forEach(el => el.textContent = data.online);
          const stat = document.getElementById('liveViewerStat');
          if (stat) stat.textContent = '🟢 ' + data.online;
        } catch (e) {}
      }
      setInterval(pollLiveViewers, 10000);
    </script>`;
  return shell(brandTitle(settings, "Admin Dashboard"), body, { branding: settings });
}

// ─── Admin User Details page ──────────────────────────────────────────────
async function adminUserDetailsPage(env, user, message) {
  const [purchases, downloads, watchHistory, friends, friendReqIn, friendReqOut, sentGiftIds, coinHistory, notifs] = await Promise.all([
    getPurchases(env, user.email), getDownloads(env, user.email), getWatchHistory(env, user.email),
    getFriends(env, user.email), getFriendRequestsIn(env, user.email), getFriendRequestsOut(env, user.email),
    getSentGifts(env, user.email), getCoinHistory(env, user.email), getNotifications(env, user.email)
  ]);
  const gifts = (await Promise.all(sentGiftIds.map(id => getGift(env, id)))).filter(Boolean);

  const giftRows = gifts.length ? gifts.map(g => `
    <tr>
      <td>@${escapeHtml(g.senderUsername)}</td><td>@${escapeHtml(g.recipientUsername)}</td>
      <td>💰${g.amount}</td><td>${new Date(g.createdAt).toLocaleString()}</td>
      <td>${g.status}</td>
      <td>${g.status === "completed" ? new Date(g.createdAt + (g.reverseWindowMinutes || 360) * 60000).toLocaleString() : "—"}</td>
    </tr>`).join("") : `<tr><td colspan="6" style="color:var(--text-dim);">No gifts sent.</td></tr>`;

  const body = `
    <div class="admin-wrap">
      <div class="admin-title">👤 User Details — @${escapeHtml(user.username)}</div>
      ${message ? `<div class="msg">${escapeHtml(message)}</div>` : ""}
      <p><a class="nav-link" href="/admin?tab=users">&larr; Back to Users</a></p>

      <h4>Profile</h4>
      <div class="grid-2" style="max-width:640px;">
        <div class="stat-card"><div class="num">${escapeHtml(user.name)}</div><div class="lbl">Display name</div></div>
        <div class="stat-card"><div class="num">${new Date(user.createdAt).toLocaleDateString()}</div><div class="lbl">Account created</div></div>
        <div class="stat-card"><div class="num">${user.lastSeen ? timeAgo(new Date(user.lastSeen).toISOString()) : "—"}</div><div class="lbl">Last seen</div></div>
        <div class="stat-card"><div class="num">${escapeHtml(user.email)}</div><div class="lbl">Email</div></div>
      </div>

      <h4 style="margin-top:22px;">Coins</h4>
      <div class="grid-2" style="max-width:640px;">
        <div class="stat-card"><div class="num">💰${user.coins}</div><div class="lbl">Current balance</div></div>
        <div class="stat-card"><div class="num">💰${user.totalEarned || 0}</div><div class="lbl">Lifetime earned</div></div>
      </div>
      <form method="POST" action="/admin/user-coins-adjust" style="display:flex;gap:6px;margin-top:10px;max-width:300px;">
        <input type="hidden" name="email" value="${escapeHtml(user.email)}">
        <input type="number" name="amount" placeholder="amount" min="1" style="margin:0;">
        <button type="submit" name="action" value="add" style="margin:0;">+ Add</button>
        <button type="submit" name="action" value="deduct" style="margin:0;">- Deduct</button>
      </form>

      <h4 style="margin-top:22px;">Purchases &amp; Activity</h4>
      <div class="grid-2" style="max-width:640px;">
        <div class="stat-card"><div class="num">${purchases.length}</div><div class="lbl">Movies/series purchased</div></div>
        <div class="stat-card"><div class="num">${downloads.length}</div><div class="lbl">Downloads</div></div>
        <div class="stat-card"><div class="num">${watchHistory.length}</div><div class="lbl">Watch history entries</div></div>
        <div class="stat-card"><div class="num">${friends.length}</div><div class="lbl">Friends</div></div>
        <div class="stat-card"><div class="num">${friendReqIn.length}</div><div class="lbl">Pending requests (in)</div></div>
        <div class="stat-card"><div class="num">${friendReqOut.length}</div><div class="lbl">Pending requests (out)</div></div>
      </div>

      <h4 style="margin-top:22px;">Gift history</h4>
      <table class="users-table"><thead><tr><th>Sender</th><th>Recipient</th><th>Amount</th><th>Time</th><th>Status</th><th>Reverse deadline</th></tr></thead><tbody>${giftRows}</tbody></table>

      <h4 style="margin-top:22px;">Security</h4>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="tag">${user.provider === "google" ? "Google sign-in" : "Password"}</span>
        <span class="tag ${user.verified ? "tag-green" : ""}">${user.verified ? "Verified" : "Unverified"}</span>
        <span class="tag ${user.isBanned ? "" : "tag-green"}">${user.isBanned ? "Banned" : "Active"}</span>
        <span class="tag">${user.isPrivate ? "Private profile" : "Public profile"}</span>
      </div>

      <div style="margin-top:24px;border-top:1px solid var(--border);padding-top:18px;">
        <h4 style="color:var(--danger);">⚠️ Danger zone</h4>
        <form method="POST" action="/admin/user-reset-local" style="margin-bottom:10px;">
          <input type="hidden" name="email" value="${escapeHtml(user.email)}">
          <button class="unban-btn" type="submit">↺ Reset local data (browser-side only)</button>
        </form>
        <form method="POST" action="/admin/user-complete-reset" onsubmit="return dangerConfirm(this, '${escapeHtml(user.username)}')" style="margin-bottom:10px;">
          <input type="hidden" name="email" value="${escapeHtml(user.email)}">
          <button class="ban-btn" type="submit">⚠️ COMPLETE ACCOUNT RESET</button>
        </form>
        <p class="admin-sub">This will permanently remove: coins, purchases, watch history, favorites, gifts, friends, notifications, rewards, and user activity. Local saved browser data will also be cleared next time this user's browser checks in. The account itself will NOT be deleted.</p>
        <form method="POST" action="/admin/user-delete" onsubmit="return dangerConfirm(this, '${escapeHtml(user.username)}')">
          <input type="hidden" name="email" value="${escapeHtml(user.email)}">
          <button class="ban-btn" type="submit">🗑 Delete Account</button>
        </form>
      </div>
    </div>`;
  return shell("User Details — Admin", body);
}

async function adminCommentsPage(video, comments, message) {
  const rows = comments.length
    ? comments.map((c, i) => `
      <div class="comment-admin">
        <div class="cmeta">
          <strong style="color:var(--gold);">${escapeHtml(c.name || "Anonymous")}</strong>${c.isAdmin ? ' <span class="tag">Admin</span>' : ""}
          · ${timeAgo(c.time)}
          · <span style="font-family:monospace;font-size:10px;">${escapeHtml(c.id || String(i))}</span>
        </div>
        <div class="ctext">${escapeHtml(c.text)}</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <form method="POST" action="/admin/comment-delete">
            <input type="hidden" name="videoId" value="${escapeHtml(video.id)}">
            <input type="hidden" name="commentId" value="${escapeHtml(c.id || String(i))}">
            <button class="ban-btn" type="submit">Delete</button>
          </form>
          <form method="POST" action="/admin/comment-edit" style="display:flex;gap:6px;flex:1;flex-wrap:wrap;">
            <input type="hidden" name="videoId" value="${escapeHtml(video.id)}">
            <input type="hidden" name="commentId" value="${escapeHtml(c.id || String(i))}">
            <input type="text" name="text" value="${escapeHtml(c.text)}" style="flex:1;margin:0;padding:6px 10px;font-size:12px;">
            <button type="submit" style="margin:0;padding:6px 12px;font-size:12px;border-radius:6px;">Save</button>
          </form>
        </div>
      </div>`).join("")
    : `<div style="color:var(--text-dim);">No comments on this video.</div>`;

  const body = `
    <div class="admin-wrap">
      <p><a class="back-link" href="/admin?tab=videos">&larr; Back to videos</a></p>
      <div class="admin-title">Comments: ${escapeHtml(video.title)}</div>
      ${message ? `<div class="msg">${escapeHtml(message)}</div>` : ""}
      <div style="margin:16px 0 24px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:16px;">
        <label style="margin-top:0;">Add a comment as Admin</label>
        <form method="POST" action="/admin/comment-add" style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">
          <input type="hidden" name="videoId" value="${escapeHtml(video.id)}">
          <textarea name="text" required placeholder="Write a comment..." style="flex:1;min-width:220px;margin-bottom:0;"></textarea>
          <button type="submit" style="margin:0;">Post as Admin</button>
        </form>
      </div>
      <div>${rows}</div>
    </div>`;
  return shell("Comments — Admin", body);
}

function profilePage(session, viewedUser, isOwn, referralUrl, branding, friendStatus, friendsCount) {
  const joinedStr = viewedUser.createdAt ? new Date(viewedUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
  const statsVisible = !viewedUser.isPrivate || friendStatus === "friends" || isOwn;
  const showCoins = statsVisible && viewedUser.showCoinsPublic !== false; // defaults to visible unless the user explicitly hid it
  const friendButtonHtml = () => {
    if (!session) return `<a href="/login" class="ban-btn" style="display:inline-block;text-decoration:none;">+ Add Friend</a>`;
    if (friendStatus === "friends") return `
      <span class="tag tag-green">✓ Friends</span>
      <form method="POST" action="/api/friends/remove" onsubmit="return doFriendAction(event,this)" style="display:inline;"><input type="hidden" name="username" value="${escapeHtml(viewedUser.username)}"><button type="submit" class="unban-btn">Remove Friend</button></form>`;
    if (friendStatus === "request_sent") return `
      <span class="tag">Request Sent</span>
      <form method="POST" action="/api/friends/cancel" onsubmit="return doFriendAction(event,this)" style="display:inline;"><input type="hidden" name="username" value="${escapeHtml(viewedUser.username)}"><button type="submit" class="unban-btn">Cancel Request</button></form>`;
    if (friendStatus === "request_incoming") return `
      <form method="POST" action="/api/friends/accept" onsubmit="return doFriendAction(event,this)" style="display:inline;"><input type="hidden" name="username" value="${escapeHtml(viewedUser.username)}"><button type="submit" class="ban-btn">Accept</button></form>
      <form method="POST" action="/api/friends/decline" onsubmit="return doFriendAction(event,this)" style="display:inline;"><input type="hidden" name="username" value="${escapeHtml(viewedUser.username)}"><button type="submit" class="unban-btn">Decline</button></form>`;
    return `<button type="button" class="ban-btn" onclick="doAddFriend('${escapeHtml(viewedUser.username)}')">+ Add Friend</button>`;
  };
  const body = `
    <header>
      ${wordmarkHtml(branding)}
      <a class="nav-link" href="/">&larr; Back to home</a>
      <div class="user-menu">${themeToggleBtn()}${session ? `${notifBell()}<span class="coin-badge" id="coinBadge">💰${session.coins}</span>` : ""}</div>
    </header>
    ${session ? activeTimeProgressBar() : ""}
    <div class="perf"></div>
    <main>
      <h2 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin-top:14px;">👤 ${escapeHtml(viewedUser.name)}</h2>
      <p style="color:var(--text-dim);font-size:13px;">@${escapeHtml(viewedUser.username)}</p>
      <p style="color:var(--text-dim);font-size:12.5px;margin-top:2px;">Joined: ${joinedStr}</p>
      ${!isOwn ? `
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        ${showCoins ? `<span style="font-size:14px;">💰 ${viewedUser.coins}</span>` : `<span style="font-size:14px;color:var(--text-dim);">💰 Coins hidden</span>`}
        ${statsVisible && viewedUser.showFriends !== false ? `<span style="font-size:14px;">👥 ${friendsCount || 0} Friends</span>` : ""}
      </div>
      <div style="margin-top:10px;" id="friendActionBox">${friendButtonHtml()}</div>
      <div id="friendActionMsg" style="margin-top:6px;font-size:12.5px;"></div>
      ` : ""}
      ${isOwn ? `
      <div class="grid-2" style="margin-top:20px;max-width:640px;">
        <div class="stat-card"><div class="num">💰${viewedUser.coins}</div><div class="lbl">Coin balance</div></div>
        <div class="stat-card"><div class="num">${escapeHtml(viewedUser.referralCode)}</div><div class="lbl">Your referral code</div></div>
        <div class="stat-card"><div class="num">${viewedUser.referralCount || 0}</div><div class="lbl">Friends referred</div></div>
      </div>
      <div class="section-head">Gift coins</div>
      <form id="giftForm" onsubmit="return doGift(event)" style="max-width:420px;">
        <label>Recipient username</label>
        <input type="text" id="giftUsername" required placeholder="username (not email)">
        <label>Amount</label>
        <input type="number" id="giftAmount" min="1" required placeholder="e.g. 10">
        <button type="submit">Send gift</button>
      </form>
      <div id="giftMsg" style="margin-top:10px;"></div>
      <div id="giftReverseBox" style="display:none;margin-top:6px;">
        <span id="giftReverseTimer" style="font-size:12.5px;color:var(--text-dim);"></span>
        <button type="button" id="giftReverseBtn" onclick="doReverseGift()" style="padding:5px 12px;font-size:12px;margin-left:8px;">↩ Reverse Gift</button>
      </div>

      <div class="section-head">Invite friends</div>
      <p style="color:var(--text-dim);font-size:13px;">Share your referral link — you both get a bonus when they sign up, plus you earn coins whenever they make a purchase.</p>
      <input type="text" readonly value="${escapeHtml(referralUrl)}" onclick="this.select();navigator.clipboard.writeText(this.value)" style="cursor:pointer;">

      <div class="section-head">Privacy</div>
      <form method="POST" action="/api/profile/privacy" onsubmit="return savePrivacy(event, this)" style="max-width:420px;display:flex;flex-direction:column;gap:8px;">
        <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
          <input type="checkbox" name="showCoinsPublic" ${viewedUser.showCoinsPublic !== false ? "checked" : ""} style="width:auto;margin:0;"> Show coin balance on my public profile
        </label>
        <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
          <input type="checkbox" name="showFriends" ${viewedUser.showFriends !== false ? "checked" : ""} style="width:auto;margin:0;"> Show friends count on my public profile
        </label>
        <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;">
          <input type="checkbox" name="isPrivate" ${viewedUser.isPrivate ? "checked" : ""} style="width:auto;margin:0;"> Make my profile stats private
        </label>
        <button type="submit" style="max-width:160px;">Save privacy settings</button>
      </form>
      <div id="privacyMsg" style="margin-top:6px;font-size:12.5px;"></div>

      <div class="section-head">Account</div>
      <a href="/logout" class="ban-btn" style="display:inline-block;text-decoration:none;">🚪 Log out</a>
      ` : (!viewedUser.isPrivate ? `
      <div class="grid-2" style="margin-top:20px;max-width:640px;">
        <div class="stat-card"><div class="num">💰${viewedUser.coins}</div><div class="lbl">Coin balance</div></div>
        <div class="stat-card"><div class="num">${viewedUser.referralCount || 0}</div><div class="lbl">Friends referred</div></div>
      </div>
      ` : `<p style="color:var(--text-dim);font-size:13px;margin-top:16px;">This user has made their profile stats private.</p>`)}
    </main>
    ${bottomNav(session, "profile")}
    <script>
      let giftCountdownTimer = null;
      async function doGift(e) {
        e.preventDefault();
        const toUsername = document.getElementById('giftUsername').value.trim();
        const amount = parseInt(document.getElementById('giftAmount').value, 10);
        const msgEl = document.getElementById('giftMsg');
        msgEl.textContent = 'Sending...';
        try {
          const res = await fetch('/api/gift', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ toUsername, amount }) });
          const data = await res.json();
          if (!res.ok) { msgEl.textContent = data.error || 'Gift failed'; msgEl.style.color = 'var(--danger)'; return false; }
          msgEl.textContent = 'Sent 💰' + amount + ' to @' + toUsername + '!';
          msgEl.style.color = 'var(--gold)';
          document.getElementById('coinBadge').textContent = '💰' + data.senderCoins;
          startGiftReverseCountdown(data.giftId, data.createdAt + data.reverseWindowMinutes * 60000);
        } catch(e) { msgEl.textContent = 'Gift failed'; }
        return false;
      }
      function startGiftReverseCountdown(giftId, deadline) {
        const box = document.getElementById('giftReverseBox');
        const timerEl = document.getElementById('giftReverseTimer');
        const btn = document.getElementById('giftReverseBtn');
        box.style.display = 'block';
        btn.dataset.giftId = giftId;
        btn.style.display = 'inline-block';
        if (giftCountdownTimer) clearInterval(giftCountdownTimer);
        function tick() {
          const remaining = deadline - Date.now();
          if (remaining <= 0) {
            timerEl.textContent = 'Reverse available: Expired';
            btn.style.display = 'none';
            clearInterval(giftCountdownTimer);
            return;
          }
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          timerEl.textContent = 'Reverse available: ' + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        }
        tick();
        giftCountdownTimer = setInterval(tick, 1000);
      }
      async function doReverseGift() {
        const btn = document.getElementById('giftReverseBtn');
        const giftId = btn.dataset.giftId;
        const msgEl = document.getElementById('giftMsg');
        btn.disabled = true;
        try {
          const res = await fetch('/api/gift/reverse', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ giftId }) });
          const data = await res.json();
          if (!res.ok) { msgEl.textContent = data.error || 'Reverse failed'; msgEl.style.color = 'var(--danger)'; btn.disabled = false; return; }
          msgEl.textContent = 'Gift reversed — coins returned.';
          msgEl.style.color = 'var(--gold)';
          document.getElementById('coinBadge').textContent = '💰' + data.senderCoins;
          document.getElementById('giftReverseBox').style.display = 'none';
          if (giftCountdownTimer) clearInterval(giftCountdownTimer);
        } catch(e) { msgEl.textContent = 'Reverse failed'; btn.disabled = false; }
      }
      function savePrivacy(e, form) {
        e.preventDefault();
        const msgEl = document.getElementById('privacyMsg');
        const body = { showCoinsPublic: form.showCoinsPublic.checked, showFriends: form.showFriends.checked, isPrivate: form.isPrivate.checked };
        fetch('/api/profile/privacy', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
          .then(r => r.json().then(data => ({ ok: r.ok, data })))
          .then(({ ok, data }) => { msgEl.textContent = ok ? 'Saved.' : (data.error || 'Failed to save'); msgEl.style.color = ok ? 'var(--gold)' : 'var(--danger)'; })
          .catch(() => { msgEl.textContent = 'Failed to save'; });
        return false;
      }
      async function doAddFriend(username) {
        const box = document.getElementById('friendActionBox');
        const msgEl = document.getElementById('friendActionMsg');
        box.innerHTML = '<span class="tag">Sending...</span>';
        try {
          const res = await fetch('/api/friends/request', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username }) });
          const data = await res.json();
          if (!res.ok) { msgEl.textContent = data.error || 'Request failed'; msgEl.style.color = 'var(--danger)'; box.innerHTML = '<button type="button" class="ban-btn" onclick="doAddFriend(\\'' + username + '\\')">+ Add Friend</button>'; return; }
          box.innerHTML = '<span class="tag">Request Sent</span>';
        } catch(e) { msgEl.textContent = 'Request failed'; }
      }
      function doFriendAction(e, form) {
        e.preventDefault();
        const action = form.getAttribute('action');
        const username = form.querySelector('input[name=username]').value;
        const msgEl = document.getElementById('friendActionMsg');
        fetch(action, { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username }) })
          .then(r => r.json().then(data => ({ ok: r.ok, data })))
          .then(({ ok, data }) => { if (!ok) { msgEl.textContent = data.error || 'Action failed'; msgEl.style.color = 'var(--danger)'; return; } location.reload(); })
          .catch(() => { msgEl.textContent = 'Action failed'; });
        return false;
      }
    </script>
    ${session ? liveUpdateScript() : ""}
  `;
  return shell(brandTitle(branding, "Profile"), body, { music: !!session, spa: !!session, branding });
}

// ─── Users directory (NEW — Home → 👥 Users) ─────────────────────────────────
// Public list of every non-banned, non-private user's username, each linking
// to their profile page. Search filters client-visible rows only (the full
// list still comes from the server so pagination stays simple).
function usersDirectoryPage(session, branding, userRows, q, totalCount) {
  const rows = userRows.length ? userRows.map(u => `
    <a href="/profile/${encodeURIComponent(u.username)}" class="stat-card" style="text-decoration:none;display:flex;align-items:center;gap:10px;text-align:left;">
      <div style="width:38px;height:38px;border-radius:50%;background:var(--bg-panel-2);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold);flex-shrink:0;">${escapeHtml((u.username || "?")[0].toUpperCase())}</div>
      <div style="min-width:0;">
        <div style="font-weight:600;color:var(--text-warm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">@${escapeHtml(u.username)}${u.verified ? " ✓" : ""}</div>
        <div style="font-size:12px;color:var(--text-dim);">${escapeHtml(u.name || "")}</div>
      </div>
    </a>`).join("") : `<p style="color:var(--text-dim);">No users found.</p>`;
  const body = `
    <header>
      ${wordmarkHtml(branding)}
      <form class="searchform" method="GET" action="/users" autocomplete="off">
        <input class="search" type="text" name="q" value="${escapeHtml(q || "")}" placeholder="Search usernames...">
      </form>
      <a class="nav-link" href="/">&larr; Back to home</a>
      <div class="user-menu">${themeToggleBtn()}${session ? `${notifBell()}<span class="coin-badge" id="coinBadge">💰${session.coins}</span>` : `<a class="nav-link" href="/login">Login</a>`}</div>
    </header>
    ${session ? activeTimeProgressBar() : ""}
    <div class="perf"></div>
    <main>
      <h2 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin-top:14px;">👥 Users${totalCount ? ` (${totalCount})` : ""}</h2>
      <p style="color:var(--text-dim);font-size:13px;">Browse every member and tap a username to view their profile.</p>
      <div class="grid-2" style="margin-top:16px;">${rows}</div>
    </main>
    ${bottomNav(session, "users")}
  `;
  return shell(brandTitle(branding, "Users"), body, { music: !!session, spa: !!session, branding });
}

function checkinPage(session, alreadyChecked, settings, streak) {
  const s = streak || 0;
  const nextStreakGoal = settings.checkinStreakIntervalDays > 0
    ? (Math.floor(s / settings.checkinStreakIntervalDays) + 1) * settings.checkinStreakIntervalDays
    : null;
  const body = `
    <header>
      ${wordmarkHtml(settings)}
      <a class="nav-link" href="/">&larr; Back to home</a>
      <div class="user-menu">${themeToggleBtn()}<span class="coin-badge" id="coinBadge">💰${session.coins}</span></div>
    </header>
    ${activeTimeProgressBar()}
    <div class="perf"></div>
    <main>
      <div class="purchase-gate" style="max-width:420px;margin:30px auto;">
        <div class="pg-icon">🎁</div>
        <h3>Daily Check-in</h3>
        <p>Check in once a day for 💰${settings.dailyCheckinCoins} free coins. Stay active on the site or watch videos for ${settings.activeTimeThresholdMinutes}+ minutes today (capped at ${settings.activeTimeDailyCapMinutes}m/day) for another 💰${settings.activeTimeBaseCoins}, plus 💰${settings.activeTimeChunkCoins} for every extra ${settings.activeTimeChunkMinutes} minutes.</p>
        ${settings.checkinStreakIntervalDays > 0 ? `
        <div class="streak-box" style="background:var(--bg-panel-2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin:14px 0;text-align:left;">
          <div style="font-weight:700;color:var(--gold);">🔥 ${s}-day streak</div>
          <div style="font-size:12.5px;color:var(--text-dim);margin-top:2px;">${nextStreakGoal ? `Check in ${nextStreakGoal - s} more day${nextStreakGoal - s === 1 ? "" : "s"} in a row for a +💰${settings.checkinStreakBonusCoins} streak bonus.` : "Keep checking in daily to build your streak."}</div>
        </div>` : ""}
        <button class="purchase-btn" id="checkinBtn" ${alreadyChecked ? "disabled" : ""} onclick="doCheckin()">${alreadyChecked ? "Already checked in today ✓" : "Check in for 💰" + settings.dailyCheckinCoins}</button>
      </div>
    </main>
    ${bottomNav(session, "")}
    <script>
      async function doCheckin() {
        const btn = document.getElementById('checkinBtn');
        btn.disabled = true; btn.textContent = 'Checking in...';
        try {
          const res = await fetch('/api/checkin', { method:'POST', credentials:'same-origin' });
          const data = await res.json();
          if (!res.ok) { btn.textContent = data.error || 'Already checked in'; return; }
          document.getElementById('coinBadge').textContent = '💰' + data.coins;
          btn.textContent = 'Checked in ✓ (+' + data.awarded + ' coins)' + (data.streakBonus ? ' 🔥 streak bonus!' : '');
        } catch(e) { btn.disabled = false; btn.textContent = 'Try again'; }
      }
    </script>
    ${session ? liveUpdateScript() : ""}
  `;
  return shell(brandTitle(settings, "Daily Check-in"), body, { music: !!session, spa: !!session, branding: settings });
}

// Blocking modal shown on the homepage for logged-in users who haven't
// checked in yet today. Backdrop clicks/Escape do nothing — the only ways
// out are "Check in now" (claims the reward and closes) or "Not now"
// (closes for this page view only; it reappears on the next visit/reload
// until the user actually checks in).
async function forcedCheckinModal(env, session, settings) {
  if (!session) return "";
  const alreadyChecked = await hasCheckedInToday(env, session.email);
  if (alreadyChecked) return "";
  return `
    <div id="forceCheckinOverlay" style="position:fixed;inset:0;background:rgba(8,10,16,.72);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div class="purchase-gate" style="max-width:400px;width:100%;background:var(--bg-panel);border:1px solid var(--border);border-radius:12px;padding:28px 22px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5);">
        <div class="pg-icon" style="font-size:34px;">🎁</div>
        <h3 style="margin:8px 0 4px;">Daily Check-in</h3>
        <p style="color:var(--text-dim);font-size:13.5px;">Check in for 💰${settings.dailyCheckinCoins} free coins before you browse today. Keep your streak going for a bonus every ${settings.checkinStreakIntervalDays} days!</p>
        <button class="purchase-btn" id="forceCheckinBtn" style="width:100%;margin-top:10px;" onclick="doForceCheckin()">Check in for 💰${settings.dailyCheckinCoins}</button>
        <button type="button" onclick="document.getElementById('forceCheckinOverlay').remove()" style="background:none;border:none;color:var(--text-dim);font-size:12.5px;margin-top:12px;cursor:pointer;text-decoration:underline;">Not now</button>
      </div>
    </div>
    <script>
      async function doForceCheckin() {
        const btn = document.getElementById('forceCheckinBtn');
        btn.disabled = true; btn.textContent = 'Checking in...';
        try {
          const res = await fetch('/api/checkin', { method:'POST', credentials:'same-origin' });
          const data = await res.json();
          if (!res.ok) { btn.textContent = data.error || 'Already checked in'; setTimeout(() => { const o = document.getElementById('forceCheckinOverlay'); if (o) o.remove(); }, 900); return; }
          const badge = document.getElementById('coinBadge');
          if (badge) badge.textContent = '💰' + data.coins;
          btn.textContent = 'Checked in ✓ (+' + data.awarded + ' coins)' + (data.streakBonus ? ' 🔥' : '');
          setTimeout(() => { const o = document.getElementById('forceCheckinOverlay'); if (o) o.remove(); }, 1100);
        } catch (e) { btn.disabled = false; btn.textContent = 'Try again'; }
      }
    </script>`;
}

// ─── Purchases / Coin History / Notifications ────────────────────────────────

async function getPurchases(env, email) {
  const raw = await env.VIDEOS.get("purchases:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function savePurchases(env, email, list) {
  await env.VIDEOS.put("purchases:" + email.toLowerCase(), JSON.stringify(list));
}
async function addPurchase(env, email, videoId) {
  const list = await getPurchases(env, email);
  if (!list.includes(videoId)) list.unshift(videoId);
  await savePurchases(env, email, list);
  return list;
}

async function getDownloads(env, email) {
  const raw = await env.VIDEOS.get("downloads:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function addDownload(env, email, videoId) {
  const list = await getDownloads(env, email);
  if (!list.includes(videoId)) list.unshift(videoId);
  await env.VIDEOS.put("downloads:" + email.toLowerCase(), JSON.stringify(list));
  return list;
}

async function getCoinHistory(env, email) {
  const raw = await env.VIDEOS.get("coinhistory:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function addCoinHistoryEntry(env, email, entry) {
  const list = await getCoinHistory(env, email);
  list.unshift({ id: crypto.randomUUID(), time: Date.now(), ...entry });
  await env.VIDEOS.put("coinhistory:" + email.toLowerCase(), JSON.stringify(list.slice(0, 200)));
}

async function getNotifications(env, email) {
  const raw = await env.VIDEOS.get("notifications:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function addNotification(env, email, text, meta) {
  const list = await getNotifications(env, email);
  list.unshift({
    id: crypto.randomUUID(),
    text,
    time: Date.now(),
    read: false,
    type: (meta && meta.type) || "system",
    actionUrl: (meta && meta.actionUrl) || null,
    metadata: (meta && meta.metadata) || null
  });
  await env.VIDEOS.put("notifications:" + email.toLowerCase(), JSON.stringify(list.slice(0, 100)));
}
async function markNotificationsRead(env, email) {
  const list = await getNotifications(env, email);
  const updated = list.map(n => ({ ...n, read: true }));
  await env.VIDEOS.put("notifications:" + email.toLowerCase(), JSON.stringify(updated));
}

// ─── Global transaction log (admin) ──────────────────────────────────────────
// A single capped feed of every coin movement between users — gifts, gift
// reversals, and coin requests — so the admin can audit who sent/requested
// what, to/from whom, and when, in one place.

async function addTransactionLog(env, entry) {
  const raw = await env.VIDEOS.get("transaction_log");
  const list = raw ? JSON.parse(raw) : [];
  list.unshift({ id: crypto.randomUUID(), time: Date.now(), ...entry });
  await env.VIDEOS.put("transaction_log", JSON.stringify(list.slice(0, 1000)));
}
async function getTransactionLog(env) {
  const raw = await env.VIDEOS.get("transaction_log");
  return raw ? JSON.parse(raw) : [];
}

// ─── Admin audit log ──────────────────────────────────────────────────────
// Records sensitive admin actions (resets, deletions, ad changes, coin
// adjustments, bans, gift reversals). Never exposed to normal users.
async function addAdminAuditLog(env, admin, action, target, details) {
  const raw = await env.VIDEOS.get("admin_audit_log");
  const log = raw ? JSON.parse(raw) : [];
  log.unshift({ admin, action, target, details: details || "", timestamp: Date.now() });
  await env.VIDEOS.put("admin_audit_log", JSON.stringify(log.slice(0, 1000)));
}
async function getAdminAuditLog(env) {
  const raw = await env.VIDEOS.get("admin_audit_log");
  return raw ? JSON.parse(raw) : [];
}

// ─── Gift records (password-confirmed, reversible within 1 hour) ────────────

// Reverse window is admin-configurable (settings.giftReverseWindowMinutes,
// default 360 = 6 hours). Always computed server-side from the gift's own
// stored createdAt — never trust a client-supplied timestamp.
async function saveGift(env, gift) {
  await env.VIDEOS.put("gift:" + gift.id, JSON.stringify(gift));
}
async function getGift(env, id) {
  const raw = await env.VIDEOS.get("gift:" + id);
  return raw ? JSON.parse(raw) : null;
}
async function getSentGifts(env, email) {
  const raw = await env.VIDEOS.get("giftsent:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function addSentGiftRef(env, email, giftId) {
  const list = await getSentGifts(env, email);
  list.unshift(giftId);
  await env.VIDEOS.put("giftsent:" + email.toLowerCase(), JSON.stringify(list.slice(0, 50)));
}

// ─── User-to-user coin requests ──────────────────────────────────────────────
// requesterEmail is asking targetEmail to send them `amount` coins. Stored
// denormalized (same record) under both the requester's "outgoing" list and
// the target's "incoming" list, matching the pattern used elsewhere in this
// file (e.g. coin history) so each side can render without extra lookups.

async function getCoinRequestsIn(env, email) {
  const raw = await env.VIDEOS.get("coinreq_in:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function getCoinRequestsOut(env, email) {
  const raw = await env.VIDEOS.get("coinreq_out:" + email.toLowerCase());
  return raw ? JSON.parse(raw) : [];
}
async function createCoinRequest(env, requester, target, amount, note) {
  const rec = {
    id: crypto.randomUUID(),
    requesterEmail: requester.email, requesterUsername: requester.username,
    targetEmail: target.email, targetUsername: target.username,
    amount, note: (note || "").toString().slice(0, 140),
    status: "pending", createdAt: Date.now()
  };
  const inList = await getCoinRequestsIn(env, target.email);
  inList.unshift(rec);
  await env.VIDEOS.put("coinreq_in:" + target.email.toLowerCase(), JSON.stringify(inList.slice(0, 50)));
  const outList = await getCoinRequestsOut(env, requester.email);
  outList.unshift(rec);
  await env.VIDEOS.put("coinreq_out:" + requester.email.toLowerCase(), JSON.stringify(outList.slice(0, 50)));
  await addNotification(env, target.email, `@${requester.username} requested 💰${amount} coins from you`);
  await addTransactionLog(env, { type: "request_created", from: target.username, to: requester.username, amount, requestId: rec.id, status: "pending" });
  return rec;
}
// Updates the status of a request in both the requester's and target's stored copies.
async function setCoinRequestStatus(env, id, requesterEmail, targetEmail, status) {
  for (const [prefix, email] of [["coinreq_in:", targetEmail], ["coinreq_out:", requesterEmail]]) {
    const raw = await env.VIDEOS.get(prefix + email.toLowerCase());
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) { list[idx].status = status; list[idx].resolvedAt = Date.now(); await env.VIDEOS.put(prefix + email.toLowerCase(), JSON.stringify(list)); }
  }
}
async function findCoinRequest(env, targetEmail, id) {
  const list = await getCoinRequestsIn(env, targetEmail);
  return list.find(r => r.id === id) || null;
}

// ─── Top earners / leaderboard ───────────────────────────────────────────────
// Ranks by lifetime coins earned (totalEarned), not current balance, so
// spending coins doesn't knock someone off the board. Users the admin has
// marked private are excluded from the public-facing list entirely.

async function getTopEarners(env, limit, includePrivate) {
  const users = await getAllUsers(env);
  const enriched = await enrichUsers(env, users);
  return enriched
    .filter(u => !u.isBanned && (includePrivate || !u.isPrivate))
    .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
    .slice(0, limit || 10);
}

// Adjusts a user's coin balance by delta, syncs the all_users list, records
// history + a notification. Also updates the users list entry's coin count.
async function adjustUserCoins(env, email, delta, reason, meta) {
  const user = await getUser(env, email);
  if (!user) return null;
  const balanceBefore = user.coins || 0;
  user.coins = Math.max(0, (user.coins || 0) + delta);
  if (delta > 0) user.totalEarned = (user.totalEarned || 0) + delta; // lifetime earned, for the Top Earners leaderboard
  await saveUser(env, user);
  let users = await getAllUsers(env);
  const idx = users.findIndex(u => u.email === user.email);
  if (idx !== -1) { users[idx].coins = user.coins; await updateUsersList(env, users); }
  await addCoinHistoryEntry(env, email, {
    type: (meta && meta.type) || (delta >= 0 ? "admin_credit" : "admin_debit"),
    amount: delta,
    reason: reason || "Balance adjusted by admin",
    balanceAfter: user.coins
  });
  if (!meta || meta.notify !== false) {
    await addNotification(env, email, `Your balance was ${delta >= 0 ? "credited" : "debited"} ${Math.abs(delta)} coin${Math.abs(delta) === 1 ? "" : "s"}${meta && meta.notifySuffix ? " " + meta.notifySuffix : " by admin"}. New balance: 💰${user.coins}`, { type: (meta && meta.type) || (delta >= 0 ? "admin_adjustment" : "admin_adjustment") });
  }
  // Admin-visible audit trail of every coin movement. Skipped when the caller
  // wants to log one combined row itself instead (e.g. gifts — see /api/gift,
  // which logs a single sender→recipient row rather than two separate ones).
  if (!meta || !meta.skipTxLog) {
    await addTransactionLog(env, {
      type: (meta && meta.type) || (delta >= 0 ? "admin_credit" : "admin_debit"),
      from: delta < 0 ? user.username : null,
      to: delta >= 0 ? user.username : null,
      amount: Math.abs(delta),
      status: "completed",
      note: reason || "",
      balanceBefore, balanceAfter: user.coins
    });
  }
  return user;
}

// ─── Achievements / daily tasks (NEW) ────────────────────────────────────────
// One-time lifetime-milestone rewards, separate from the recurring daily
// check-in / active-time rewards above. Admin-editable catalog, admin on/off
// switch (settings.achievementsEnabled) — see Admin → 🏆 Achievements.

function getAchievementCatalog(settings) {
  const list = Array.isArray(settings.achievements) ? settings.achievements : ACHIEVEMENT_DEFAULTS;
  return list.filter(a => a && a.id && a.stat);
}

// Lifetime stats an achievement can be measured against. getPurchases() is
// the only extra KV read here, and this whole function only runs when an
// achievement-relevant action happens (checkin, rating, purchase, active
// time heartbeat) — never on every page view — so the cost stays low.
async function computeUserStats(env, user) {
  const purchases = await getPurchases(env, user.email);
  return {
    watchHours: (user.totalStayMinutes || 0) / 60,
    checkinStreak: user.checkinStreak || 0,
    referralCount: user.referralCount || 0,
    purchaseCount: purchases.length,
    reviewCount: user.reviewCount || 0,
    accountAgeDaysVerified: user.verified ? 1 : 0
  };
}

// Checks every enabled achievement against the user's current lifetime
// stats and awards coins (once each) for any newly-crossed threshold.
// Cheap to call often — already-earned achievements short-circuit instantly,
// and a no-op fast path skips everything when the feature is off.
async function checkAndAwardAchievements(env, email) {
  const settings = await getSettings(env);
  if (!settings.achievementsEnabled) return [];
  const user = await getUser(env, email);
  if (!user) return [];
  const earned = new Set(user.earnedAchievements || []);
  const pending = getAchievementCatalog(settings).filter(a => a.enabled !== false && !earned.has(a.id));
  if (!pending.length) return [];
  const stats = await computeUserStats(env, user);
  const newlyEarned = pending.filter(a => (stats[a.stat] || 0) >= a.threshold);
  if (!newlyEarned.length) return [];
  user.earnedAchievements = [...earned, ...newlyEarned.map(a => a.id)];
  await saveUser(env, user);
  for (const a of newlyEarned) {
    if (a.coins > 0) {
      await adjustUserCoins(env, email, a.coins, `Achievement unlocked: ${a.label}`, { type: "achievement", notifySuffix: `— you unlocked "${a.label}" 🏆` });
    } else {
      await addNotification(env, email, `🏆 Achievement unlocked: "${a.label}"`, { type: "achievement" });
    }
  }
  return newlyEarned;
}

// ─── Daily check-in & active-time rewards ────────────────────────────────────

async function hasCheckedInToday(env, email) {
  const raw = await env.VIDEOS.get("checkin:" + email.toLowerCase() + ":" + todayStr());
  return !!raw;
}
async function doDailyCheckin(env, email) {
  const key = "checkin:" + email.toLowerCase() + ":" + todayStr();
  const existing = await env.VIDEOS.get(key);
  if (existing) return { alreadyChecked: true };
  const settings = await getSettings(env);
  await env.VIDEOS.put(key, "1", { expirationTtl: 60 * 60 * 24 * 3 });

  // Streak tracking: consecutive calendar days (UTC) with a check-in.
  // A gap of a day or more resets the streak back to 1.
  const today = todayStr();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let user = await getUser(env, email);
  let streak = 1;
  if (user) {
    streak = user.lastCheckinDate === yesterday ? (user.checkinStreak || 0) + 1 : 1;
    user.checkinStreak = streak;
    user.lastCheckinDate = today;
    await saveUser(env, user);
  }

  let awarded = settings.dailyCheckinCoins;
  let reason = "Daily check-in reward";
  const hitStreakBonus = settings.checkinStreakIntervalDays > 0 && streak > 0 && streak % settings.checkinStreakIntervalDays === 0;
  if (hitStreakBonus && settings.checkinStreakBonusCoins > 0) {
    awarded += settings.checkinStreakBonusCoins;
    reason = `Daily check-in + ${streak}-day streak bonus`;
  }

  user = await adjustUserCoins(env, email, awarded, reason, { type: hitStreakBonus ? "active_streak_bonus" : "checkin", notifySuffix: "for your daily check-in" });
  return { alreadyChecked: false, awarded, coins: user ? user.coins : 0, streak, streakBonus: hitStreakBonus ? settings.checkinStreakBonusCoins : 0 };
}

// Records one "heartbeat" minute of active time for the user today, awarding
// the base bonus at the threshold and +chunkCoins for every extra chunk.
async function recordActiveMinute(env, email) {
  const settings = await getSettings(env);
  const key = "activetime:" + email.toLowerCase() + ":" + todayStr();
  const raw = await env.VIDEOS.get(key);
  const state = raw ? JSON.parse(raw) : { minutes: 0, baseAwarded: false, chunksAwarded: 0, lastBeat: 0 };
  const now = Date.now();
  // Daily cap: once today's counted minutes hit the cap, stop counting
  // further minutes (and thus stop awarding further coins) until it resets
  // at UTC midnight. Prevents idle-tab / auto-clicker farming.
  const cap = settings.activeTimeDailyCapMinutes || SETTINGS_DEFAULTS.activeTimeDailyCapMinutes;
  if (state.minutes >= cap) return { ...attachProgress(state, settings, 0), minuteCounted: false, capped: true };
  // Debounce: only count a new minute if >=50s since last counted beat.
  if (now - state.lastBeat < 50 * 1000) return { ...attachProgress(state, settings, 0), minuteCounted: false };
  state.minutes += 1;
  state.lastBeat = now;
  let awarded = 0;
  let reason = "";
  if (!state.baseAwarded && state.minutes >= settings.activeTimeThresholdMinutes) {
    state.baseAwarded = true;
    awarded += settings.activeTimeBaseCoins;
    reason = `Active on site for ${settings.activeTimeThresholdMinutes}+ minutes today`;
  }
  if (state.baseAwarded) {
    const extraMinutes = state.minutes - settings.activeTimeThresholdMinutes;
    const eligibleChunks = extraMinutes >= 0 ? Math.floor(extraMinutes / settings.activeTimeChunkMinutes) : 0;
    if (eligibleChunks > state.chunksAwarded) {
      const newChunks = eligibleChunks - state.chunksAwarded;
      awarded += newChunks * settings.activeTimeChunkCoins;
      state.chunksAwarded = eligibleChunks;
      reason = reason || `Extra ${settings.activeTimeChunkMinutes}-minute activity bonus`;
    }
  }
  await env.VIDEOS.put(key, JSON.stringify(state), { expirationTtl: 60 * 60 * 24 * 3 });
  if (awarded > 0) {
    await adjustUserCoins(env, email, awarded, reason, { type: "active_time", notifySuffix: "for staying active today" });
  }
  return { ...attachProgress(state, settings, awarded), minuteCounted: true };
}

// Adds the fields the front-end progress bar needs: percent toward the next
// reward tier (base threshold, then each chunk), and a human label.
function attachProgress(state, settings, awarded) {
  let percent, label, minutesToGo;
  const cap = settings.activeTimeDailyCapMinutes || SETTINGS_DEFAULTS.activeTimeDailyCapMinutes;
  if (state.minutes >= cap) {
    percent = 100;
    minutesToGo = 0;
    label = `Daily active-time cap reached (${cap}m)`;
  } else if (!state.baseAwarded) {
    percent = Math.min(100, Math.round((state.minutes / settings.activeTimeThresholdMinutes) * 100));
    minutesToGo = Math.max(0, settings.activeTimeThresholdMinutes - state.minutes);
    label = `${state.minutes}/${settings.activeTimeThresholdMinutes} min today`;
  } else {
    const extraMinutes = state.minutes - settings.activeTimeThresholdMinutes;
    const intoChunk = extraMinutes - (state.chunksAwarded * settings.activeTimeChunkMinutes);
    percent = Math.min(100, Math.round((intoChunk / settings.activeTimeChunkMinutes) * 100));
    minutesToGo = Math.max(0, settings.activeTimeChunkMinutes - intoChunk);
    label = `+💰${settings.activeTimeChunkCoins} in ${minutesToGo}m`;
  }
  return {
    minutes: state.minutes,
    baseAwarded: state.baseAwarded,
    chunksAwarded: state.chunksAwarded,
    thresholdMinutes: settings.activeTimeThresholdMinutes,
    chunkMinutes: settings.activeTimeChunkMinutes,
    chunkCoins: settings.activeTimeChunkCoins,
    baseCoins: settings.activeTimeBaseCoins,
    capMinutes: cap,
    capped: state.minutes >= cap,
    percent,
    minutesToGo,
    label,
    awarded: awarded || 0
  };
}

// ─── Header widgets / live update script ─────────────────────────────────────

function notifBell() {
  return `
    <div class="bell-wrap" onclick="toggleNotifPanel(event)">
      🔔<span class="bell-dot" id="bellDot"></span>
      <div class="notif-panel" id="notifPanel"><div class="notif-empty">Loading...</div></div>
    </div>`;
}

// Thin progress bar shown under the header for logged-in users, showing
// progress toward today's next active-time coin reward. Kept live by the
// heartbeat responses in liveUpdateScript().
function activeTimeProgressBar() {
  return `
    <div class="activebar-wrap" id="activeBarWrap">
      <span class="activebar-label">⏱ Active-time reward</span>
      <div class="activebar-track"><div class="activebar-fill" id="activeBarFill" style="width:0%;"></div></div>
      <span class="activebar-pct" id="activeBarPct">—</span>
    </div>`;
}

// Injected on any page rendered for a logged-in user. Polls balance +
// notifications so admin coin/like/view edits reflect live without reload,
// and sends a heartbeat once a minute (while the tab is visible) to track
// active time for the daily activity coin rewards.
// Injected on Home for guests only (logged-in users are tracked by
// liveUpdateScript's /api/heartbeat instead). Sends a lightweight presence
// ping so the admin Analytics tab can count anonymous visitors separately
// from registered ones, without requiring login.
function guestHeartbeatScript() {
  return `
  <script>
  (function(){
    if (window.__tamizhzoraGuestHbStarted) return;
    window.__tamizhzoraGuestHbStarted = true;
    function ping() {
      if (document.visibilityState !== 'visible') return;
      fetch('/api/visitor-heartbeat', { method: 'POST', credentials: 'same-origin' }).catch(function(){});
    }
    ping();
    setInterval(ping, 20000);
  })();
  </script>`;
}

function liveUpdateScript() {
  return `
  <script>
  (function(){
    // This script is injected on every SPA-navigable logged-in page, so it
    // can run again each time the user client-side-navigates back to one of
    // them within the same persistent document. Only ever start the
    // polling/heartbeat timers once per document — they keep running in the
    // background across navigation instead of restarting.
    if (window.__tamizhzoraLiveUpdateStarted) return;
    window.__tamizhzoraLiveUpdateStarted = true;
    let lastNotifCount = 0;
    async function pollStatus() {
      try {
        const res = await fetch('/api/balance', { credentials: 'same-origin' });
        if (res.status === 403) {
          let data = {};
          try { data = await res.json(); } catch (e) {}
          if (data.banned) {
            if (data.clearLocal) { try { localStorage.clear(); } catch (e) {} }
            window.location.href = '/login?msg=' + encodeURIComponent(data.error || 'Your account has been banned.');
            return;
          }
        }
        if (!res.ok) return;
        const data = await res.json();
        // Remote local-data reset: the server hands back a token that changes
        // whenever the admin bumps this user's (or every user's) reset counter.
        // On the first-ever poll we just record the baseline silently; any
        // later change means "admin asked us to wipe local data now".
        if (data.lrt) {
          let seenLrt = null;
          try { seenLrt = localStorage.getItem('app_lrt'); } catch (e) {}
          if (seenLrt === null) {
            try { localStorage.setItem('app_lrt', data.lrt); } catch (e) {}
          } else if (seenLrt !== data.lrt) {
            try {
              localStorage.clear();
              localStorage.setItem('app_lrt', data.lrt);
            } catch (e) {}
            const t = document.getElementById('toast');
            if (t) {
              t.textContent = 'Your saved local data was reset by the site admin.';
              t.classList.add('show');
              setTimeout(() => t.classList.remove('show'), 3000);
            }
          }
        }
        document.querySelectorAll('#coinBadge').forEach(el => el.textContent = '💰' + data.coins);
        const dot = document.getElementById('bellDot');
        if (dot) dot.textContent = data.unread > 0 ? String(data.unread) : '';
        if (dot) dot.style.display = data.unread > 0 ? 'flex' : 'none';
        const bnBadge = document.getElementById('bnNotifBadge');
        if (bnBadge) { bnBadge.textContent = data.unread > 0 ? String(data.unread) : ''; bnBadge.style.display = data.unread > 0 ? 'inline-block' : 'none'; }
        if (data.unread > lastNotifCount && lastNotifCount !== 0) {
          const t = document.getElementById('toast');
          if (t) {
            t.textContent = 'You have a new notification';
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2500);
          }
        }
        lastNotifCount = data.unread;
      } catch (e) {}
    }
    // Active-time progress bar: the server tracks real minutes and grants
    // rewards (see /api/heartbeat), but between heartbeats we tick a local
    // "estimated" mm:ss clock every second so the bar/label move smoothly
    // instead of jumping once a minute. It resyncs to the server's true
    // minute count on every heartbeat response.
    let activeProgress = null;
    let estSecondsSinceSync = 0;
    function renderActiveBar() {
      const fill = document.getElementById('activeBarFill');
      const pct = document.getElementById('activeBarPct');
      if (!fill || !pct || !activeProgress) return;
      const estTotalSeconds = activeProgress.minutes * 60 + estSecondsSinceSync;
      const mm = Math.floor(estTotalSeconds / 60);
      const ss = estTotalSeconds % 60;
      const clock = mm + ':' + String(ss).padStart(2, '0');
      let percent;
      if (!activeProgress.baseAwarded) {
        percent = Math.min(100, (estTotalSeconds / (activeProgress.thresholdMinutes * 60)) * 100);
      } else {
        const extraSeconds = estTotalSeconds - activeProgress.thresholdMinutes * 60;
        const intoChunkSeconds = extraSeconds - (activeProgress.chunksAwarded * activeProgress.chunkMinutes * 60);
        percent = Math.min(100, (intoChunkSeconds / (activeProgress.chunkMinutes * 60)) * 100);
      }
      fill.style.width = Math.max(0, percent) + '%';
      pct.textContent = clock + ' active today (est.)';
    }
    function updateActiveBar(progress) {
      if (!progress) return;
      activeProgress = progress;
      estSecondsSinceSync = 0;
      renderActiveBar();
      if (progress.awarded > 0) {
        const t = document.getElementById('toast');
        if (t) {
          t.textContent = 'Earned 💰' + progress.awarded + ' for staying active!';
          t.classList.add('show');
          setTimeout(() => t.classList.remove('show'), 2500);
        }
        if (progress.coins !== undefined) {
          document.querySelectorAll('#coinBadge').forEach(el => el.textContent = '💰' + progress.coins);
        }
      }
    }
    // Ticks the estimated clock every second while the tab is visible.
    setInterval(() => {
      if (document.visibilityState !== 'visible' || !activeProgress) return;
      estSecondsSinceSync += 1;
      renderActiveBar();
    }, 1000);
    // Sends a heartbeat every 60s while the tab is visible; the server
    // debounces internally so switching tabs briefly won't over-count.
    // Only logged-in users ever call this (liveUpdateScript is only
    // injected on pages rendered for an active session).
    async function heartbeat() {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/heartbeat', { method: 'POST', credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        updateActiveBar(data);
      } catch(e) {}
    }
    window.notifIconFor = function(type) {
      return { friend_request: '👥', friend_accepted: '✓', gift_received: '🎁', gift_sent: '🎁', gift_reversed: '↩', purchase_completed: '✓', download_completed: '⬇', admin_adjustment: '💰', account_reset: '⚠️', system: '🔔' }[type] || '🔔';
    };
    window.toggleNotifPanel = async function(e) {
      e.stopPropagation();
      const panel = document.getElementById('notifPanel');
      if (!panel) return;
      const showing = panel.classList.contains('show');
      document.querySelectorAll('.notif-panel.show').forEach(p => p.classList.remove('show'));
      if (showing) return;
      panel.classList.add('show');
      try {
        const res = await fetch('/api/notifications', { credentials: 'same-origin' });
        const data = await res.json();
        const list = data.notifications || [];
        panel.innerHTML = '<div class="notif-panel-head">Notifications' + (list.length ? '<button type="button" class="notif-markall" onclick="markAllNotifsRead(event)">Mark all read</button>' : '') + '</div>' +
          (list.length
            ? list.map(n => '<a class="notif-item' + (!n.read ? ' unread' : '') + '" href="' + (n.actionUrl || '#') + '"><span class="notif-icon">' + window.notifIconFor(n.type) + '</span><div><div class="notif-text">' + n.text.replace(/</g,'&lt;') + '</div><div class="ntime">' + new Date(n.time).toLocaleString() + '</div></div></a>').join('')
            : '<div class="notif-empty">No notifications yet</div>') +
          (list.length ? '<a class="notif-viewall" href="/notifications">View all</a>' : '');
        const dot = document.getElementById('bellDot');
        if (dot) dot.style.display = 'none';
        const bnBadge = document.getElementById('bnNotifBadge');
        if (bnBadge) bnBadge.style.display = 'none';
        lastNotifCount = 0;
        fetch('/api/notifications/read', { method: 'POST', credentials: 'same-origin' }).catch(()=>{});
      } catch (e) { panel.innerHTML = '<div class="notif-empty">Failed to load</div>'; }
    };
    window.markAllNotifsRead = function(e) {
      e.preventDefault(); e.stopPropagation();
      fetch('/api/notifications/read', { method: 'POST', credentials: 'same-origin' }).then(() => {
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
      });
    };
    document.addEventListener('click', () => {
      document.querySelectorAll('.notif-panel.show').forEach(p => p.classList.remove('show'));
    });
    pollStatus();
    heartbeat();
    setInterval(pollStatus, 8000);
    // Sent frequently; the server-side 50s debounce (recordActiveMinute) means
    // this doesn't over-count — it just makes the "active today" reward sync
    // faster without ever needing a page refresh.
    setInterval(heartbeat, 15000);
  })();
  </script>`;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get("cf-connecting-ip") || "unknown";

    try {
      // ── STEP 3: read-only KV migration audit (temporary) ────────────────
      // Fully isolated: does not read/modify any variable used by the
      // routes below, does not touch env.VIDEOS.put/delete anywhere, and
      // does not touch env.DB. Gated on its own secret (env.MIGRATION_SECRET)
      // inside handleMigrationAudit, independent of the admin-session gate
      // below. Remove this block (and the import above, and the
      // migration/kv-audit.js file) once the audit is no longer needed.
      if (path.startsWith("/migration/kv-audit")) {
        return handleMigrationAudit(request, env, url);
      }

      // ── Admin route gate ────────────────────────────────────────────────
      // Checked before anything else touches admin data. /admin/login itself
      // (and its POST) must stay reachable while logged out, everything else
      // under /admin or /api/admin/ requires a valid admin_session cookie.
      if ((path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/")) && path !== "/admin/login") {
        const adminOk = await isAdminAuthed(request, env);
        if (!adminOk) {
          if (path.startsWith("/api/admin/")) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
          }
          return new Response(null, { status: 303, headers: { Location: url.origin + "/admin/login" } });
        }
      }
      if (path === "/admin/login" && request.method === "GET") {
        const err = url.searchParams.get("err");
        return new Response(shell("Admin Login", `
          <div class="gate-wrap">
            <div class="gate-icon">🔐</div>
            <h2>Admin Login</h2>
            ${err ? `<p style="color:var(--danger);">Incorrect password.</p>` : ""}
            <form method="POST" action="/admin/login" style="max-width:320px;margin:0 auto;">
              <input type="password" name="password" placeholder="Admin password" autofocus style="margin-bottom:10px;">
              <button class="purchase-btn" type="submit" style="width:100%;">Log in</button>
            </form>
          </div>`), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (path === "/admin/login" && request.method === "POST") {
        const form = await request.formData();
        const pw = (form.get("password") || "").toString();
        if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) {
          return new Response(null, { status: 303, headers: { Location: url.origin + "/admin/login?err=1" } });
        }
        return new Response(null, { status: 303, headers: { Location: url.origin + "/admin", "Set-Cookie": await buildAdminCookie(env) } });
      }
      if (path === "/admin/logout") {
        return new Response(null, { status: 303, headers: { Location: url.origin + "/admin/login", "Set-Cookie": clearAdminCookie() } });
      }

      let session = await getSession(request, env);

      // REAL-TIME BAN ENFORCEMENT: re-check the live account on every request
      // (not just the signed cookie, which can't be revoked on its own) so a
      // ban (or a deletion) takes effect immediately instead of waiting for
      // the cookie to expire. Also flags the client to wipe its local data
      // (watch-later list, saved position, device id, etc).
      if (session) {
        const liveUser = await getUser(env, session.email);
        if (!liveUser || liveUser.isBanned) {
          const banMsg = liveUser && liveUser.banReason ? `Your account has been banned: ${liveUser.banReason}` : (liveUser ? "Your account has been banned." : "Your account no longer exists.");
          const isApiPath = path.startsWith("/api/");
          const isAuthPath = path === "/login" || path === "/signup" || path === "/logout";
          if (isApiPath) {
            return new Response(JSON.stringify({ error: banMsg, banned: true, clearLocal: true }), {
              status: 403,
              headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() }
            });
          }
          if (!isAuthPath) {
            return new Response(null, {
              status: 303,
              headers: { Location: url.origin + "/login?clear=1&msg=" + encodeURIComponent(banMsg), "Set-Cookie": clearSessionCookie() }
            });
          }
          // On /login, /signup, /logout: just treat the visitor as logged out.
          session = null;
        }
      }

      // HOME
      if (path === "/" && request.method === "GET") {
        // Default sort is release date (descending) — NOT upload order. Bug fix:
        // this used to default to "newest" (createdAt/upload order), so a fresh
        // visit to "/" never actually showed the intended release-date ordering
        // until the user explicitly clicked a sort tab.
        const sort = url.searchParams.get("sort") || "release";
        const q = url.searchParams.get("q") || "";
        const category = url.searchParams.get("category") || "";
        const subCategory = url.searchParams.get("sub") || "";
        const priceFilter = url.searchParams.get("price") || "";
        const maxCoins = parseInt(url.searchParams.get("max") || "20", 10);
        const videos = await getVideos(env);
        // ADMIN PREVIEW MODE (NEW — 👁 eye button on the admin dashboard):
        // ?preview=admin only ever does anything for a currently-authenticated
        // admin (checked server-side via the signed admin_session cookie, same
        // as every other /admin* gate) — a regular user or guest hitting this
        // URL sees the completely normal page, ads and all. When active, ads
        // are hidden site-wide on this response and a small fixed banner marks
        // the page as a preview so the admin can't mistake it for the live view.
        const previewMode = url.searchParams.get("preview") === "admin" && await isAdminAuthed(request, env);
        const html = await homePage(videos, env, sort, q, category, subCategory, session, request, priceFilter, maxCoins, previewMode);
        const respHeaders = { "Content-Type": "text/html;charset=UTF-8" };
        // Issue a stable, non-personal visitor cookie for guests so the admin
        // Analytics "anonymous online / visits today" counters can dedupe
        // heartbeats from the same browser (see recordAnonymousPresence).
        if (!session && !getVisitorIdFromCookie(request)) {
          respHeaders["Set-Cookie"] = visitorCookieHeader(crypto.randomUUID());
        }
        return new Response(html, { headers: respHeaders });
      }

      // SEARCH AUTOCOMPLETE
      // PWA MANIFEST — built live from centralized branding
      if (path === "/manifest.json" && request.method === "GET") {
        const branding = await getBranding(env);
        return new Response(manifestJson(branding), { headers: { "Content-Type": "application/manifest+json" } });
      }

      if (path === "/api/search-suggest" && request.method === "GET") {
        const q = (url.searchParams.get("q") || "").toLowerCase().trim();
        if (!q || q.length < 2) return new Response(JSON.stringify({ suggestions: [] }), { headers: { "Content-Type": "application/json" } });
        const videos = await getVideos(env);
        const matches = videos.filter(isPublished).filter(v => v.title.toLowerCase().includes(q)).slice(0, 6).map(v => v.title);
        return new Response(JSON.stringify({ suggestions: matches }), { headers: { "Content-Type": "application/json" } });
      }

      // API: BACKGROUND MUSIC CONFIG (NEW — public-ish, gated by login like the
      // rest of the site) — the shared music widget (see musicPlayerWidget/shell)
      // fetches this on every non-watch page instead of threading settings
      // through every page-render function.
      if (path === "/api/background-music" && request.method === "GET") {
        // Public: guests get the same background-music behavior as logged-in
        // users while browsing (Home, movie/series details, etc). This only
        // returns the already-signed proxy URL for the site's music track —
        // no per-user or video data — so it's safe to serve to anyone.
        const settings = await getSettings(env);
        const bm = settings.backgroundMusic || {};
        if (!bm.enabled || !bm.driveId) {
          return new Response(JSON.stringify({ enabled: false }), { headers: { "Content-Type": "application/json" } });
        }
        const src = await buildSignedSrc(env.DRIVE_PROXY_BASE, bm.driveId, env.LINK_SECRET);
        return new Response(JSON.stringify({
          enabled: true, src, title: bm.title || "", loop: bm.loop !== false, volume: typeof bm.volume === "number" ? bm.volume : 0.35, autoplay: bm.autoplay !== false
        }), { headers: { "Content-Type": "application/json" } });
      }

      // WATCH
      if (path === "/watch" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const msg = url.searchParams.get("msg");
        const videos = await getVideos(env);
        const video = videos.find((v) => v.id === id);
        if (!video || video.deleted) return new Response("Video not found", { status: 404 });
        // Draft videos are never visible to the public — only an authenticated
        // admin can open the direct link, to preview it before publishing.
        if (video.draft && !(await isAdminAuthed(request, env))) return new Response("Video not found", { status: 404 });
        if (isScheduledFuture(video)) return new Response("This video isn't published yet", { status: 404 });

        const settings = await getBranding(env);
        const freeMode = isFreeMode(settings);

        const likeData = await getLikeData(env, id);
        const comments = await getComments(env, id);
        const ratingList = await getRatings(env, id);

        // Series context — a trashed series is treated as if the video had
        // no series at all (no row, no bundle-unlock option) until restored.
        let seriesInfo = null;
        if (video.seriesId) {
          const series = await getSeriesById(env, video.seriesId);
          if (series && !series.deleted) {
            const parts = sortByUploadOrder(videos.filter(v => v.seriesId === series.id && !v.deleted && isPublished(v)));
            const purchasesForOwn = session ? await getPurchases(env, session.email) : [];
            const owned = purchasesForOwn.includes("series:" + series.id) || parts.every(p => p.coinCost === 0 || purchasesForOwn.includes(p.id));
            seriesInfo = { series, parts, owned };
          }
        }

        const coinCost = video.coinCost || 0;
        let purchased = true;
        let purchasesList = [];
        if (coinCost > 0) {
          if (!session) purchased = false;
          else {
            purchasesList = await getPurchases(env, session.email);
            purchased = purchasesList.includes(id) || (video.seriesId && purchasesList.includes("series:" + video.seriesId));
          }
        }
        // In free mode, every video is unlocked for everyone regardless of coinCost/purchase state.
        // But "unlocked" only ever means "no coins required" — separately, an
        // account may or may not be required to actually watch, controlled by
        // Admin → Access Control (settings.accountRequired, default true).
        //
        // accountRequired = true (default): a logged-out visitor is always
        // locked out of playback, even for a free (coinCost: 0) video or when
        // free mode is on — this reproduces the original, unchanged behavior.
        //
        // accountRequired = false: a logged-out visitor may watch anything
        // that's already eligible for free access (free mode, or coinCost 0)
        // exactly like a logged-in user would — but is still locked out of
        // anything that costs coins, since guests can never have a purchase
        // on file. guestGate distinguishes the "no account at all" case (show
        // a "Login to watch" prompt) from the normal coin-purchase gate.
        const guestGate = !session && isAccountRequired(settings);
        const locked = guestGate || (!freeMode && coinCost > 0 && !purchased);

        // Views are no longer bumped on page load — see /api/view, which
        // only counts a view after 5+ minutes of actual watch time.
        const views = (await getViews(env, id)).count;
        const related = videos.filter((v) => v.id !== id && !v.deleted && isPublished(v)).slice(0, 6);
        const src = locked ? "" : await buildSignedSrc(env.DRIVE_PROXY_BASE, video.driveId, env.LINK_SECRET);
        const watchAd = await getAdForPlacement(env, "watch");
        const adCode = watchAd ? watchAd.code : "";
        const userAction = await getUserLikeAction(env, id, session?.email);
        // Used only to label the Download button correctly (cost vs. "already
        // downloaded — free re-download") — the actual charge/eligibility
        // check always happens server-side in /api/download regardless of
        // what this label says, so a stale/tampered label can't skip payment.
        const alreadyDownloaded = session ? (await getDownloads(env, session.email)).includes(id) : false;
        const previewMode = url.searchParams.get("preview") === "admin" && await isAdminAuthed(request, env);

        return new Response(await watchPage(video, src, likeData.likes, likeData.dislikes, views, comments, msg, related, session, adCode, userAction, locked, purchased, ratingList, seriesInfo, freeMode, guestGate, settings, alreadyDownloaded, previewMode), {
          headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
      }

      // API: RECORD A VIEW (only after 5+ min of actual watch time — see watchPage script)
      if (path === "/api/view" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const id = (body.id || "").toString();
        if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
        const count = await incViews(env, id, session.email, ip);
        return new Response(JSON.stringify({ views: count }), { headers: { "Content-Type": "application/json" } });
      }

      // API: DEVICE/IP DUPLICATE-ACCOUNT CHECK (used by the signup page to warn
      // the visitor before they even fill out the form)
      if (path === "/api/device-check" && request.method === "GET") {
        const deviceId = (url.searchParams.get("deviceId") || "").toString().trim().slice(0, 100);
        const ipAccountEmails = await getIpAccounts(env, ip);
        const deviceAccountEmails = await getDeviceAccounts(env, deviceId);
        const hit = (await firstLiveAccount(env, ipAccountEmails)) || (await firstLiveAccount(env, deviceAccountEmails));
        return new Response(JSON.stringify({ exists: !!hit }), { headers: { "Content-Type": "application/json" } });
      }

      // ─── GOOGLE OAUTH ──────────────────────────────────────────────────────
      // GOOGLE: START — redirects to Google's consent screen. The referral
      // code (if any) and a CSRF nonce travel in the signed `state` param,
      // since the whole login/signup flow is now Google-only.
      if (path === "/auth/google" && request.method === "GET") {
        const settings = await getSettings(env);
        if (!settings.googleClientId) {
          return new Response(loginPage("Google Sign-In isn't configured yet. Please contact the site admin."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }
        const refCode = url.searchParams.get("ref") || "";
        const returnTo = safeReturnPath(url.searchParams.get("return"));
        const nonce = crypto.randomUUID();
        const statePayload = JSON.stringify({ ref: refCode, ret: returnTo, nonce });
        const stateB64 = btoa(unescape(encodeURIComponent(statePayload)));
        const stateSig = await hmacHex(env.LINK_SECRET, stateB64);
        const state = encodeURIComponent(`${stateB64}.${stateSig}`);
        const redirectUri = url.origin + "/auth/google/callback";
        const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
          client_id: settings.googleClientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          state,
          prompt: "select_account"
        }).toString();
        return Response.redirect(authUrl, 302);
      }

      // GOOGLE: CALLBACK — exchanges the auth code for tokens, fetches the
      // profile, and finds-or-creates the local account. This single route
      // handles both "login" and "signup" since Google is the only provider.
      if (path === "/auth/google/callback" && request.method === "GET") {
        const settings = await getSettings(env);
        const code = url.searchParams.get("code");
        const stateRaw = url.searchParams.get("state") || "";
        const oauthError = url.searchParams.get("error");
        if (oauthError) return new Response(loginPage("Google sign-in was cancelled."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        if (!code || !settings.googleClientId || !settings.googleClientSecret) {
          return new Response(loginPage("Google sign-in failed. Please try again."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }

        // Verify state signature (CSRF protection)
        let refCode = "";
        let returnTo = "";
        const dot = stateRaw.lastIndexOf(".");
        if (dot !== -1) {
          const b64 = stateRaw.slice(0, dot);
          const sig = stateRaw.slice(dot + 1);
          const expected = await hmacHex(env.LINK_SECRET, b64);
          if (expected === sig) {
            try {
              const parsed = JSON.parse(decodeURIComponent(escape(atob(b64))));
              refCode = parsed.ref || "";
              returnTo = safeReturnPath(parsed.ret || "");
            } catch (e) {}
          }
        }

        const redirectUri = url.origin + "/auth/google/callback";
        let tokenData;
        try {
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: settings.googleClientId,
              client_secret: settings.googleClientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code"
            }).toString()
          });
          tokenData = await tokenRes.json();
          if (!tokenRes.ok || !tokenData.access_token) throw new Error("token exchange failed");
        } catch (e) {
          return new Response(loginPage("Google sign-in failed while exchanging the code. Please try again."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }

        let profile;
        try {
          const profRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: "Bearer " + tokenData.access_token }
          });
          profile = await profRes.json();
          if (!profile || !profile.email) throw new Error("no profile");
        } catch (e) {
          return new Response(loginPage("Google sign-in failed while fetching your profile. Please try again."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }

        const email = String(profile.email).toLowerCase();
        let user = await getUser(env, email);

        if (user) {
          if (user.isBanned) {
            return new Response(loginPage(user.banReason ? `Account is banned: ${user.banReason}` : "Account is banned.", true), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
          }
          user.lastLoginIp = ip;
          user.lastLoginAt = Date.now();
          if (!user.googleSub && profile.sub) user.googleSub = profile.sub;
          if (!user.avatar && profile.picture) user.avatar = profile.picture;
          await saveUser(env, user);
        } else {
          // New account via Google — one account per IP/device still applies.
          const ipAccountEmails = await getIpAccounts(env, ip);
          const existingIpAccount = await firstLiveAccount(env, ipAccountEmails);
          if (existingIpAccount) {
            return new Response(loginPage("You already have an account on this device/network. Signed in with that account instead."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
          }
          const username = await uniqueUsernameFromEmail(env, email);
          const name = profile.name || username;
          let referrerEmail = null;
          if (refCode) {
            const found = await env.VIDEOS.get("user_referral:" + refCode);
            if (found && found !== email) referrerEmail = found;
          }
          user = await createGoogleUser(env, email, username, name, referrerEmail, ip, profile.sub, profile.picture);
          const users = await getAllUsers(env);
          users.push({ email: user.email, username: user.username, name: user.name, coins: user.coins, isBanned: false, signupIp: ip });
          await updateUsersList(env, users);
          await addIpAccount(env, ip, user.email);
          if (referrerEmail) {
            await applyReferralSignup(env, referrerEmail, email, name);
            const settings2 = await getSettings(env);
            if (settings2.referralSignupBonus > 0) user.coins += settings2.referralSignupBonus;
          }
        }

        const cookie = await makeSessionCookie(env, user);
        // A brand-new account still needs to pick a username first; carry the
        // original return URL along so it can continue there right after.
        const landing = user.usernameSet === false
          ? "/choose-username" + (returnTo ? "?return=" + encodeURIComponent(returnTo) : "")
          : (returnTo || "/");
        return new Response(null, { status: 303, headers: { Location: url.origin + landing, "Set-Cookie": cookie } });
      }

      // CHOOSE USERNAME — shown once, right after a brand-new Google sign-in,
      // so the user can replace their auto-generated username (email-derived)
      // with one of their own choosing.
      if (path === "/choose-username" && request.method === "GET") {
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const cuUser = await getUser(env, session.email);
        if (!cuUser) return Response.redirect(url.origin + "/login", 303);
        const returnTo = safeReturnPath(url.searchParams.get("return"));
        if (cuUser.usernameSet) return Response.redirect(url.origin + (returnTo || "/"), 303);
        const branding = await getBranding(env);
        return new Response(chooseUsernamePage(cuUser, null, returnTo, branding), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (path === "/choose-username" && request.method === "POST") {
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const cuUser = await getUser(env, session.email);
        if (!cuUser) return Response.redirect(url.origin + "/login", 303);
        const form = await request.formData();
        const desired = (form.get("username") || "").toString().trim().toLowerCase();
        const returnTo = safeReturnPath((form.get("return") || "").toString());

        if (!/^[a-z0-9_]{3,20}$/.test(desired)) {
          const branding = await getBranding(env);
          return new Response(chooseUsernamePage(cuUser, "Username must be 3–20 characters: lowercase letters, numbers, and underscores only.", returnTo, branding), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }
        if (desired !== cuUser.username) {
          const taken = await env.VIDEOS.get("user_username:" + desired);
          if (taken) {
            const branding = await getBranding(env);
            return new Response(chooseUsernamePage(cuUser, "That username is already taken.", returnTo, branding), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
          }
          await env.VIDEOS.delete("user_username:" + cuUser.username.toLowerCase());
          await env.VIDEOS.put("user_username:" + desired, cuUser.email.toLowerCase());
        }
        cuUser.username = desired;
        cuUser.usernameSet = true;
        await saveUser(env, cuUser);

        // Keep the denormalized users-list row in sync (used by admin + search)
        const usersList = await getAllUsers(env);
        const uidx = usersList.findIndex(u => u.email === cuUser.email);
        if (uidx !== -1) { usersList[uidx].username = desired; await updateUsersList(env, usersList); }

        const cookie = await makeSessionCookie(env, cuUser);
        return new Response(null, { status: 303, headers: { Location: url.origin + (returnTo || "/"), "Set-Cookie": cookie } });
      }

      // SIGNUP
      if (path === "/signup" && request.method === "GET") {
        const refCode = url.searchParams.get("ref") || "";
        const returnTo = safeReturnPath(url.searchParams.get("return"));
        const branding = await getBranding(env);
        return new Response(signupPage(null, refCode, returnTo, branding), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (path === "/signup" && request.method === "POST") {
        const form = await request.formData();
        const name = (form.get("name") || "").toString().trim().slice(0, 60);
        const username = (form.get("username") || "").toString().trim().toLowerCase();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const password = (form.get("password") || "").toString();
        const deviceId = (form.get("deviceId") || "").toString().trim().slice(0, 100);
        const refCode = ((form.get("ref") || url.searchParams.get("ref") || "").toString().trim()).toUpperCase();
        if (!name || !username || !email || !password)
          return new Response(signupPage("All fields are required.", refCode), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        const existing = await getUser(env, email);
        if (existing)
          return new Response(signupPage("Email already registered.", refCode), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        const userCheck = await env.VIDEOS.get("user_username:" + username);
        if (userCheck)
          return new Response(signupPage("Username already taken.", refCode), { headers: { "Content-Type": "text/html;charset=UTF-8" } });

        // ONE ACCOUNT PER IP / PER DEVICE: block signup if this network or this
        // browser already has a live account, instead of silently allowing a
        // second one. Points the visitor to log in with their existing account.
        const ipAccountEmails = await getIpAccounts(env, ip);
        const deviceAccountEmails = await getDeviceAccounts(env, deviceId);
        const existingIpAccount = await firstLiveAccount(env, ipAccountEmails);
        const existingDeviceAccount = existingIpAccount ? null : await firstLiveAccount(env, deviceAccountEmails);
        if (existingIpAccount || existingDeviceAccount) {
          return new Response(signupPage("You already have an account on this device/network. Please log in instead.", refCode), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }

        let referrerEmail = null;
        if (refCode) {
          const found = await env.VIDEOS.get("user_referral:" + refCode);
          if (found && found !== email) referrerEmail = found;
        }

        const user = await createUser(env, email, username, name, password, referrerEmail, ip, deviceId);
        const users = await getAllUsers(env);
        users.push({ email: user.email, username: user.username, name: user.name, coins: user.coins, isBanned: false, signupIp: ip });
        await updateUsersList(env, users);
        await addIpAccount(env, ip, user.email);
        await addDeviceAccount(env, deviceId, user.email);

        // Safety net for race conditions (e.g. two signups landing at the same
        // instant from the same IP): if more than one live account now exists
        // for this IP, auto-ban every account but the oldest.
        const liveForIp = (await Promise.all((await getIpAccounts(env, ip)).map(e => getUser(env, e)))).filter(u => u && !u.isBanned);
        if (liveForIp.length > 1) {
          liveForIp.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          for (let i = 1; i < liveForIp.length; i++) {
            liveForIp[i].isBanned = true;
            await saveUser(env, liveForIp[i]);
            const usersList = await getAllUsers(env);
            const uidx = usersList.findIndex(x => x.email === liveForIp[i].email);
            if (uidx !== -1) { usersList[uidx].isBanned = true; await updateUsersList(env, usersList); }
          }
          if (liveForIp[0].email !== user.email) {
            return new Response(signupPage("Multiple accounts detected from this network — this account has been suspended.", refCode), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
          }
        }

        // Referral signup bonus + referrer count (shared with Google signup)
        if (referrerEmail) {
          await applyReferralSignup(env, referrerEmail, email, name);
          const settings = await getSettings(env);
          if (settings.referralSignupBonus > 0) user.coins += settings.referralSignupBonus;
        }

        const cookie = await makeSessionCookie(env, user);
        return new Response(null, { status: 303, headers: { Location: url.origin + "/", "Set-Cookie": cookie } });
      }

      // LOGIN
      if (path === "/login" && request.method === "GET") {
        const msg = url.searchParams.get("msg") || null;
        const clearLocal = url.searchParams.get("clear") === "1";
        const returnTo = safeReturnPath(url.searchParams.get("return"));
        const branding = await getBranding(env);
        return new Response(loginPage(msg, clearLocal, returnTo, branding), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (path === "/login" && request.method === "POST") {
        const form = await request.formData();
        const emailOrUsername = (form.get("email") || "").toString().trim().toLowerCase();
        const password = (form.get("password") || "").toString();
        let user = await getUser(env, emailOrUsername);
        if (!user) {
          const emailFromUsername = await env.VIDEOS.get("user_username:" + emailOrUsername);
          if (emailFromUsername) user = await getUser(env, emailFromUsername);
        }
        const hash = user ? await hashPassword(env, password, user.email) : null;
        if (!user || hash !== user.passwordHash)
          return new Response(loginPage("Incorrect email/username or password."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        if (user.isBanned)
          return new Response(loginPage(user.banReason ? `Account is banned: ${user.banReason}` : "Account is banned.", true), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        user.lastLoginIp = ip;
        user.lastLoginAt = Date.now();
        await saveUser(env, user);
        const cookie = await makeSessionCookie(env, user);
        return new Response(null, { status: 303, headers: { Location: url.origin + "/", "Set-Cookie": cookie } });
      }

      // LOGOUT
      if (path === "/logout") {
        return new Response(null, { status: 303, headers: { Location: url.origin + "/", "Set-Cookie": clearSessionCookie() } });
      }

      // PROFILE
      if (path.startsWith("/profile/") && request.method === "GET") {
        const username = decodeURIComponent(path.slice("/profile/".length)).toLowerCase();
        const emailForUsername = await env.VIDEOS.get("user_username:" + username);
        if (!emailForUsername) return new Response("User not found", { status: 404 });
        const viewedUser = await getUser(env, emailForUsername);
        if (!viewedUser) return new Response("User not found", { status: 404 });
        const isOwn = session && session.username === username;
        const friendStatus = (session && !isOwn) ? await friendStatusBetween(env, session.email, viewedUser.email) : null;
        const referralUrl = url.origin + "/signup?ref=" + encodeURIComponent(viewedUser.referralCode);
        const branding = await getBranding(env);
        const friendsCount = (await getFriends(env, viewedUser.email)).length;
        return new Response(profilePage(session, viewedUser, isOwn, referralUrl, branding, friendStatus, friendsCount), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // CHECK-IN PAGE
      if (path === "/checkin" && request.method === "GET") {
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const alreadyChecked = await hasCheckedInToday(env, session.email);
        const settings = await getBranding(env); // superset of getSettings(): also carries resolved siteLogoHref/faviconHref
        const checkinUser = await getUser(env, session.email);
        return new Response(checkinPage(session, alreadyChecked, settings, checkinUser ? checkinUser.checkinStreak || 0 : 0), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      // API: CHECK-IN
      if (path === "/api/checkin" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const result = await doDailyCheckin(env, session.email);
        if (result.alreadyChecked) return new Response(JSON.stringify({ error: "Already checked in today" }), { status: 400 });
        await checkAndAwardAchievements(env, session.email);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }

      // API: HEARTBEAT (active-time tracking + real-time presence for admin analytics)
      if (path === "/api/heartbeat" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const progress = await recordActiveMinute(env, session.email);
        let coins;
        if (progress.awarded > 0) {
          const user = await getUser(env, session.email);
          coins = user ? user.coins : undefined;
        }
        // Presence: lastSeen powers "online now" in the admin analytics tab;
        // totalStayMinutes is a lifetime counter (activetime: KV above is per-day).
        const u = await getUser(env, session.email);
        if (u) {
          u.lastSeen = Date.now();
          if (progress.minuteCounted) u.totalStayMinutes = (u.totalStayMinutes || 0) + 1;
          await saveUser(env, u);
        }
        if (progress.minuteCounted) await checkAndAwardAchievements(env, session.email);
        await recordRegisteredVisit(env, session.email);
        return new Response(JSON.stringify({ ...progress, coins }), { headers: { "Content-Type": "application/json" } });
      }

      // API: VISITOR HEARTBEAT (anonymous/guest real-time presence for admin
      // analytics — logged-in users are already tracked via /api/heartbeat
      // above, so this is a no-op for them to avoid double-counting).
      if (path === "/api/visitor-heartbeat" && request.method === "POST") {
        if (session) return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        let vid = getVisitorIdFromCookie(request);
        const headers = { "Content-Type": "application/json" };
        if (!vid) {
          vid = crypto.randomUUID();
          headers["Set-Cookie"] = visitorCookieHeader(vid);
        }
        await recordAnonymousPresence(env, vid);
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // API: ADMIN ANALYTICS LIVE SNAPSHOT (polled by the Analytics tab).
      // Admin-only. When the "Live Analytics" setting is off, this returns a
      // disabled snapshot with everything zeroed/hidden — the authenticated
      // admin can always flip the setting back on in Settings to see full
      // data again, so nothing here is permanently unreachable to them.
      if (path === "/api/admin/analytics-live" && request.method === "GET") {
        const adminOk = await isAdminAuthed(request, env);
        if (!adminOk) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        const settings = await getSettings(env);
        if (settings.liveAnalyticsEnabled === false) {
          return new Response(JSON.stringify({ disabled: true, totalOnline: 0, registeredOnline: 0, anonymousOnline: 0, registeredVisitsToday: 0, anonymousVisitsToday: 0, updatedAt: Date.now() }), { headers: { "Content-Type": "application/json" } });
        }
        const snapshot = await getAnalyticsSnapshot(env);
        return new Response(JSON.stringify(snapshot), { headers: { "Content-Type": "application/json" } });
      }

      // API: GIFT COINS (by username only)
      if (path === "/api/gift" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const toUsername = (body.toUsername || "").toString().trim().toLowerCase();
        const amount = Math.floor(Number(body.amount) || 0);
        if (!toUsername) return new Response(JSON.stringify({ error: "Recipient username required" }), { status: 400 });
        if (!amount || amount <= 0) return new Response(JSON.stringify({ error: "Enter a valid amount" }), { status: 400 });
        if (toUsername === session.username) return new Response(JSON.stringify({ error: "You can't gift coins to yourself" }), { status: 400 });
        const recipientEmail = await env.VIDEOS.get("user_username:" + toUsername);
        if (!recipientEmail) return new Response(JSON.stringify({ error: "No user found with that username" }), { status: 404 });
        const sender = await getUser(env, session.email);
        if (!sender || (sender.coins || 0) < amount) return new Response(JSON.stringify({ error: "Not enough coins" }), { status: 400 });
        const recipient = await getUser(env, recipientEmail);
        if (!recipient) return new Response(JSON.stringify({ error: "No user found with that username" }), { status: 404 });

        const settings = await getSettings(env);
        const now = Date.now();
        const giftId = crypto.randomUUID();
        const gift = {
          id: giftId,
          senderEmail: sender.email, senderUsername: sender.username,
          recipientEmail: recipient.email, recipientUsername: recipient.username,
          amount,
          createdAt: now,
          reverseWindowMinutes: settings.giftReverseWindowMinutes,
          status: "completed", // completed | reversed
          reversedAt: null,
          reverseReason: null
        };

        await adjustUserCoins(env, session.email, -amount, `Gift sent to @${toUsername}`, { type: "gift_sent", notify: false, skipTxLog: true });
        await adjustUserCoins(env, recipientEmail, amount, `Gift received from @${session.username}`, { type: "gift_received", notifySuffix: `— a gift from @${session.username}`, skipTxLog: true });
        await addTransactionLog(env, { type: "gift", from: session.username, to: toUsername, amount, status: "completed", note: "Coin gift", giftId });
        await saveGift(env, gift);
        await addSentGiftRef(env, session.email, giftId);

        const updatedSender = await getUser(env, session.email);
        return new Response(JSON.stringify({ success: true, senderCoins: updatedSender.coins, giftId, reverseWindowMinutes: settings.giftReverseWindowMinutes, createdAt: now }), { headers: { "Content-Type": "application/json" } });
      }

      // API: REVERSE GIFT — sender-only, within the configured window, only
      // once. Everything (amount, sender, recipient, timestamp) is loaded
      // from the server-side gift record — nothing is trusted from the client
      // except the gift id. A KV-based claim guard prevents a double-reverse
      // race (two simultaneous clicks): whichever request wins the "reversing"
      // claim proceeds, the other is rejected.
      if (path === "/api/gift/reverse" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const giftId = (body.giftId || "").toString();
        if (!giftId) return new Response(JSON.stringify({ error: "missing giftId" }), { status: 400 });

        const gift = await getGift(env, giftId);
        if (!gift) return new Response(JSON.stringify({ error: "Gift not found" }), { status: 404 });
        if (gift.senderEmail !== session.email) return new Response(JSON.stringify({ error: "You can only reverse your own gifts" }), { status: 403 });
        if (gift.status === "reversed") return new Response(JSON.stringify({ error: "Gift already reversed" }), { status: 409 });
        if (gift.status !== "completed") return new Response(JSON.stringify({ error: "Gift cannot be reversed" }), { status: 400 });

        const settings = await getSettings(env);
        const windowMs = (gift.reverseWindowMinutes != null ? gift.reverseWindowMinutes : settings.giftReverseWindowMinutes) * 60 * 1000;
        if (Date.now() > gift.createdAt + windowMs) {
          return new Response(JSON.stringify({ error: "Gift reversal window expired" }), { status: 400 });
        }

        // Idempotency/race guard: atomically claim this gift for reversal
        // using a short-lived KV marker keyed off the gift id. If it already
        // exists, another request is already processing this reversal.
        const claimKey = "gift_reversing:" + giftId;
        const existingClaim = await env.VIDEOS.get(claimKey);
        if (existingClaim) return new Response(JSON.stringify({ error: "Gift already reversed" }), { status: 409 });
        await env.VIDEOS.put(claimKey, "1", { expirationTtl: 30 });

        // Re-read the gift after claiming, in case it was reversed between
        // our first read and the claim (belt-and-suspenders on top of the
        // claim key itself).
        const freshGift = await getGift(env, giftId);
        if (!freshGift || freshGift.status === "reversed") {
          return new Response(JSON.stringify({ error: "Gift already reversed" }), { status: 409 });
        }

        const recipient = await getUser(env, freshGift.recipientEmail);
        if (!recipient || (recipient.coins || 0) < freshGift.amount) {
          return new Response(JSON.stringify({ error: "Gift cannot be reversed because the recipient no longer has enough of the gifted amount." }), { status: 400 });
        }

        await adjustUserCoins(env, freshGift.recipientEmail, -freshGift.amount, `Gift reversed: ${freshGift.amount} coins to @${freshGift.senderUsername}`, { type: "gift_reversed", notify: false, skipTxLog: true });
        await adjustUserCoins(env, freshGift.senderEmail, freshGift.amount, `Gift reversed: received back ${freshGift.amount} coins from @${freshGift.recipientUsername}`, { type: "gift_reversed", notify: false, skipTxLog: true });

        freshGift.status = "reversed";
        freshGift.reversedAt = Date.now();
        freshGift.reverseReason = "Reversed by sender";
        await saveGift(env, freshGift);

        await addTransactionLog(env, { type: "gift_reversed", from: freshGift.recipientUsername, to: freshGift.senderUsername, amount: freshGift.amount, status: "reversed", note: `Gift reversal (original ${freshGift.senderUsername} → ${freshGift.recipientUsername})`, giftId });
        await addNotification(env, freshGift.senderEmail, `↩ Your ${freshGift.amount}-coin gift to @${freshGift.recipientUsername} was reversed.`, { type: "gift_reversed", actionUrl: "/profile" });
        await addNotification(env, freshGift.recipientEmail, `↩ The ${freshGift.amount}-coin gift from @${freshGift.senderUsername} was reversed.`, { type: "gift_reversed", actionUrl: "/profile" });

        const updatedSender = await getUser(env, freshGift.senderEmail);
        return new Response(JSON.stringify({ success: true, senderCoins: updatedSender.coins }), { headers: { "Content-Type": "application/json" } });
      }

      // API: get reversible gift status (for rendering the countdown/button)
      if (path === "/api/gift/status" && request.method === "GET") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const giftId = (url.searchParams.get("giftId") || "").toString();
        const gift = giftId ? await getGift(env, giftId) : null;
        if (!gift || gift.senderEmail !== session.email) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        const settings = await getSettings(env);
        const windowMs = (gift.reverseWindowMinutes != null ? gift.reverseWindowMinutes : settings.giftReverseWindowMinutes) * 60 * 1000;
        const deadline = gift.createdAt + windowMs;
        return new Response(JSON.stringify({ status: gift.status, deadline, reversible: gift.status === "completed" && Date.now() < deadline }), { headers: { "Content-Type": "application/json" } });
      }

      // API: FRIENDS — request/accept/decline/cancel/remove. Usernames are
      // used for the request body (UI-facing), resolved to stable emails
      // internally before any storage write. No duplicate requests/friendships
      // are ever created; each helper checks existing state first.
      if (path === "/api/friends/request" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const username = (body.username || "").toString().trim().toLowerCase();
        const targetEmail = await env.VIDEOS.get("user_username:" + username);
        if (!targetEmail) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        const fromUser = await getUser(env, session.email);
        const toUser = await getUser(env, targetEmail);
        if (!fromUser || !toUser) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        const result = await sendFriendRequest(env, fromUser, toUser);
        if (result.error) return new Response(JSON.stringify(result), { status: 400 });
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/api/friends/accept" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const username = (body.username || "").toString().trim().toLowerCase();
        const fromEmail = await env.VIDEOS.get("user_username:" + username);
        if (!fromEmail) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        const toUser = await getUser(env, session.email);
        const result = await acceptFriendRequest(env, toUser, fromEmail);
        if (result.error) return new Response(JSON.stringify(result), { status: 400 });
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/api/friends/decline" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const username = (body.username || "").toString().trim().toLowerCase();
        const fromEmail = await env.VIDEOS.get("user_username:" + username);
        if (!fromEmail) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        await declineFriendRequest(env, session.email, fromEmail);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/api/friends/cancel" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const username = (body.username || "").toString().trim().toLowerCase();
        const toEmail = await env.VIDEOS.get("user_username:" + username);
        if (!toEmail) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        await cancelFriendRequest(env, session.email, toEmail);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/api/friends/remove" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const username = (body.username || "").toString().trim().toLowerCase();
        const otherEmail = await env.VIDEOS.get("user_username:" + username);
        if (!otherEmail) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        await removeFriend(env, session.email, otherEmail);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }

      // API: PROFILE PRIVACY — user-controlled visibility of their own public profile
      if (path === "/api/profile/privacy" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const user = await getUser(env, session.email);
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        user.showCoinsPublic = body.showCoinsPublic !== false;
        user.showFriends = body.showFriends !== false;
        user.isPrivate = !!body.isPrivate;
        await saveUser(env, user);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }

      // FRIENDS PAGE
      // USERS DIRECTORY (public): every non-banned, non-private user's
      // username, linking to their profile. Optional ?q= filters by
      // username/name substring (case-insensitive).
      if (path === "/users" && request.method === "GET") {
        const branding = await getBranding(env);
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        const allUsers = await getAllUsers(env);
        const enriched = await enrichUsers(env, allUsers);
        let visible = enriched.filter(u => !u.isBanned && !u.isPrivate);
        if (q) visible = visible.filter(u => (u.username || "").toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q));
        visible.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
        return new Response(usersDirectoryPage(session, branding, visible.slice(0, 200), q, visible.length), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      if (path === "/friends" && request.method === "GET") {
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const tab = url.searchParams.get("tab") || "friends";
        const branding = await getBranding(env);
        const [friends, reqIn, reqOut] = await Promise.all([
          getFriends(env, session.email), getFriendRequestsIn(env, session.email), getFriendRequestsOut(env, session.email)
        ]);
        const friendRows = friends.length ? friends.map(f => `
          <div class="stat-card" style="text-align:left;display:flex;justify-content:space-between;align-items:center;">
            <a href="/profile/${encodeURIComponent(f.username)}" style="color:var(--gold);">@${escapeHtml(f.username)}</a>
            <form method="POST" action="/api/friends/remove" onsubmit="return doFriendAction(event,this)"><input type="hidden" name="username" value="${escapeHtml(f.username)}"><button type="submit" class="unban-btn">Remove</button></form>
          </div>`).join("") : `<p style="color:var(--text-dim);">No friends yet.</p>`;
        const reqInRows = reqIn.length ? reqIn.map(r => `
          <div class="stat-card" style="text-align:left;display:flex;justify-content:space-between;align-items:center;">
            <a href="/profile/${encodeURIComponent(r.fromUsername)}" style="color:var(--gold);">@${escapeHtml(r.fromUsername)}</a>
            <span>
              <form method="POST" action="/api/friends/accept" onsubmit="return doFriendAction(event,this)" style="display:inline;"><input type="hidden" name="username" value="${escapeHtml(r.fromUsername)}"><button type="submit" class="ban-btn">Accept</button></form>
              <form method="POST" action="/api/friends/decline" onsubmit="return doFriendAction(event,this)" style="display:inline;"><input type="hidden" name="username" value="${escapeHtml(r.fromUsername)}"><button type="submit" class="unban-btn">Decline</button></form>
            </span>
          </div>`).join("") : `<p style="color:var(--text-dim);">No pending requests.</p>`;
        const reqOutRows = reqOut.length ? reqOut.map(r => `
          <div class="stat-card" style="text-align:left;display:flex;justify-content:space-between;align-items:center;">
            <a href="/profile/${encodeURIComponent(r.toUsername)}" style="color:var(--gold);">@${escapeHtml(r.toUsername)}</a>
            <form method="POST" action="/api/friends/cancel" onsubmit="return doFriendAction(event,this)"><input type="hidden" name="username" value="${escapeHtml(r.toUsername)}"><button type="submit" class="unban-btn">Cancel</button></form>
          </div>`).join("") : `<p style="color:var(--text-dim);">No sent requests.</p>`;
        const body = `
          <header>
            ${wordmarkHtml(branding)}
            <a class="nav-link" href="/">&larr; Back to home</a>
            <div class="user-menu">${themeToggleBtn()}${notifBell()}<span class="coin-badge">💰${session.coins}</span></div>
          </header>
          <div class="perf"></div>
          <main>
            <h2 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin-top:14px;">👥 Friends</h2>
            <div class="admin-tabs">
              <button class="admin-tab ${tab === "friends" ? "active" : ""}" onclick="location.href='/friends?tab=friends'">Friends (${friends.length})</button>
              <button class="admin-tab ${tab === "requests" ? "active" : ""}" onclick="location.href='/friends?tab=requests'">Requests (${reqIn.length})</button>
              <button class="admin-tab ${tab === "sent" ? "active" : ""}" onclick="location.href='/friends?tab=sent'">Sent (${reqOut.length})</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;max-width:520px;margin-top:16px;">
              ${tab === "friends" ? friendRows : tab === "requests" ? reqInRows : reqOutRows}
            </div>
          </main>
          ${bottomNav(session, "friends")}
          <script>
            function doFriendAction(e, form) {
              e.preventDefault();
              const action = form.getAttribute('action');
              const username = form.querySelector('input[name=username]').value;
              fetch(action, { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username }) })
                .then(() => location.reload());
              return false;
            }
          </script>
          ${liveUpdateScript()}`;
        return new Response(shell(brandTitle(branding, "Friends"), body, { music: true, spa: true, branding }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // API: LIKE (toggle)
      if (path === "/api/like" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const id = (body.id || "").toString();
        if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });
        const result = await toggleLike(env, id, session.email);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }

      // API: DISLIKE (toggle)
      if (path === "/api/dislike" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const id = (body.id || "").toString();
        if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });
        const result = await toggleDislike(env, id, session.email);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }

      // API: RATE / REVIEW (separate from like/dislike)
      if (path === "/api/rate" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const id = (body.id || "").toString();
        const stars = Math.min(5, Math.max(1, Math.round(Number(body.stars) || 0)));
        const text = (body.text || "").toString();
        if (!id || !stars) return new Response(JSON.stringify({ error: "missing id/stars" }), { status: 400 });
        const wasNewReview = !(await getRatings(env, id)).some(r => r.userId === session.email);
        const list = await addOrUpdateRating(env, id, session.email, session.name, stars, text);
        if (wasNewReview) {
          const reviewer = await getUser(env, session.email);
          if (reviewer) { reviewer.reviewCount = (reviewer.reviewCount || 0) + 1; await saveUser(env, reviewer); }
          await checkAndAwardAchievements(env, session.email);
        }
        return new Response(JSON.stringify({ success: true, summary: ratingsSummary(list) }), { headers: { "Content-Type": "application/json" } });
      }

      // API: DELETE MY OWN REVIEW
      if (path === "/api/rate/delete" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json().catch(() => ({}));
        const id = (body.id || "").toString();
        if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });
        const list = await deleteOwnRating(env, id, session.email);
        return new Response(JSON.stringify({ success: true, summary: ratingsSummary(list) }), { headers: { "Content-Type": "application/json" } });
      }

      // API: PURCHASE VIDEO
      if (path === "/api/purchase" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const id = (body.id || "").toString();
        if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });
        const videos = await getVideos(env);
        const video = videos.find(v => v.id === id);
        if (!video) return new Response(JSON.stringify({ error: "Video not found" }), { status: 404 });
        const settings = await getSettings(env);
        const freeMode = isFreeMode(settings);
        const cost = freeMode ? 0 : (video.coinCost || 0);
        const purchases = await getPurchases(env, session.email);
        if (purchases.includes(id) || (video.seriesId && purchases.includes("series:" + video.seriesId))) {
          return new Response(JSON.stringify({ success: true, alreadyOwned: true }), { headers: { "Content-Type": "application/json" } });
        }
        const user = await getUser(env, session.email);
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        if (cost > 0 && (user.coins || 0) < cost) {
          return new Response(JSON.stringify({ error: "Not enough coins to purchase this video." }), { status: 400 });
        }
        if (cost > 0) {
          user.coins = (user.coins || 0) - cost;
          await saveUser(env, user);
          let users = await getAllUsers(env);
          const idx = users.findIndex(u => u.email === user.email);
          if (idx !== -1) { users[idx].coins = user.coins; await updateUsersList(env, users); }
          await addCoinHistoryEntry(env, session.email, {
            type: "purchase",
            amount: -cost,
            videoId: id,
            videoTitle: video.title,
            reason: `Purchased "${video.title}"`,
            balanceAfter: user.coins
          });
          await addTransactionLog(env, { type: "purchase", from: session.username, to: null, amount: cost, status: "completed", note: `Purchased "${video.title}"`, balanceBefore: user.coins + cost, balanceAfter: user.coins, videoId: id, videoTitle: video.title });
        }
        await addPurchase(env, session.email, id);
        await incPurchaseCount(env, id);
        await addNotification(env, session.email, `You claimed "${video.title}" for 💰${cost} coin${cost === 1 ? "" : "s"}. Find it in your Claimed tab.`);

        // Referral commission: referrer earns 1 coin (configurable) per referred purchase.
        if (user.referredBy && cost > 0) {
          if (settings.referralPurchaseCommission > 0) {
            await adjustUserCoins(env, user.referredBy, settings.referralPurchaseCommission, `Referral commission from ${user.username}'s purchase`, { type: "referral_commission", notifySuffix: `— your referral @${user.username} made a purchase` });
          }
        }

        await checkAndAwardAchievements(env, session.email);
        return new Response(JSON.stringify({ success: true, coins: user.coins }), { headers: { "Content-Type": "application/json" } });
      }

      // API: PURCHASE SERIES BUNDLE (unlocks all parts)
      if (path === "/api/purchase-series" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const id = (body.id || "").toString();
        const series = await getSeriesById(env, id);
        if (!series || series.deleted) return new Response(JSON.stringify({ error: "Series not found" }), { status: 404 });
        const settings = await getSettings(env);
        const freeMode = isFreeMode(settings);
        const cost = freeMode ? 0 : (series.coinCost || 0);
        const purchases = await getPurchases(env, session.email);
        if (purchases.includes("series:" + id)) {
          return new Response(JSON.stringify({ success: true, alreadyOwned: true }), { headers: { "Content-Type": "application/json" } });
        }
        const user = await getUser(env, session.email);
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        if (cost > 0 && (user.coins || 0) < cost) {
          return new Response(JSON.stringify({ error: "Not enough coins to unlock this series." }), { status: 400 });
        }
        if (cost > 0) {
          await adjustUserCoins(env, session.email, -cost, `Unlocked series "${series.title}"`, { type: "purchase_series", notify: false });
        }
        await addPurchase(env, session.email, "series:" + id);
        const videos = await getVideos(env);
        const parts = videos.filter(v => v.seriesId === id && !v.deleted);
        for (const p of parts) await incPurchaseCount(env, p.id);
        await addNotification(env, session.email, `You unlocked the full "${series.title}" series for 💰${cost} coin${cost === 1 ? "" : "s"}. All parts are now free to watch.`);
        await checkAndAwardAchievements(env, session.email);
        const updated = await getUser(env, session.email);
        return new Response(JSON.stringify({ success: true, coins: updated.coins }), { headers: { "Content-Type": "application/json" } });
      }

      // API: DOWNLOAD (costs coins, once per video — free in Free Mode)
      if (path === "/api/download" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const body = await request.json();
        const id = (body.id || "").toString();
        if (!id) return new Response(JSON.stringify({ error: "Video not found" }), { status: 404 });
        const videos = await getVideos(env);
        const video = videos.find(v => v.id === id);
        // IDOR / hidden-content guard: the video must exist, not be deleted,
        // and be published (not hidden, not scheduled in the future) — a
        // user can't download something they aren't allowed to see just by
        // changing the id, even if they somehow have a stale purchase entry.
        if (!video || video.deleted || !isPublished(video)) {
          return new Response(JSON.stringify({ error: "Video not found" }), { status: 404 });
        }

        const settings = await getSettings(env);
        const freeMode = isFreeMode(settings);

        // Downloads are a Paid Mode feature only — hidden and disabled in Free Mode.
        if (freeMode) return new Response(JSON.stringify({ error: "Downloads are disabled in Free Mode." }), { status: 403 });

        // Must already be able to watch it (free, purchased, or via series bundle).
        const purchases = await getPurchases(env, session.email);
        const canWatch = (video.coinCost || 0) === 0 || purchases.includes(id) || (video.seriesId && purchases.includes("series:" + video.seriesId));
        if (!canWatch) return new Response(JSON.stringify({ error: "Purchase this video before downloading it." }), { status: 400 });

        // Server-side configured cost only — never trust any amount from the
        // client. Re-check the download list right before charging (not just
        // once at the top) to keep the double-charge race window as small as
        // possible with KV's non-transactional writes.
        const downloadCost = settings.downloadCost;
        const downloads = await getDownloads(env, session.email);
        if (!downloads.includes(id)) {
          const user = await getUser(env, session.email);
          if (!user) return new Response(JSON.stringify({ error: "Account not found — please log in again." }), { status: 401 });
          if (downloadCost > 0 && (user.coins || 0) < downloadCost) {
            return new Response(JSON.stringify({
              error: `Downloading this costs 💰${downloadCost} coin${downloadCost === 1 ? "" : "s"} — you have 💰${user.coins || 0}. Earn or top up coins first; nothing was charged.`
            }), { status: 400 });
          }
          const recheck = await getDownloads(env, session.email);
          if (!recheck.includes(id)) {
            if (downloadCost > 0) {
              await adjustUserCoins(env, session.email, -downloadCost, `Downloaded "${video.title}"`, { type: "download", notify: false });
            }
            await addDownload(env, session.email, id);
          }
        }
        // Short-lived (10 min), single-use-in-spirit signed URL — never the
        // permanent Drive/storage URL, no storage secrets ever reach the
        // client, and it's tied to this specific video's driveId only.
        const src = await buildSignedDownloadSrc(env.DRIVE_PROXY_BASE, video.driveId, env.LINK_SECRET);
        const safeName = video.title.replace(/[^a-z0-9 _\-]/gi, "").trim().slice(0, 120) || "video";
        return new Response(JSON.stringify({ success: true, url: src, filename: safeName }), { headers: { "Content-Type": "application/json" } });
      }

      // API: BALANCE (live coin + unread notification count)
      if (path === "/api/balance" && request.method === "GET") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const user = await getUser(env, session.email);
        const notifs = await getNotifications(env, session.email);
        const unread = notifs.filter(n => !n.read).length;
        const settings = await getSettings(env);
        const lrt = (user ? (user.localResetToken || 0) : 0) + "." + (settings.globalLocalResetToken || 0);
        return new Response(JSON.stringify({ coins: user ? user.coins : 0, unread, lrt }), { headers: { "Content-Type": "application/json" } });
      }

      // API: NOTIFICATIONS
      if (path === "/api/notifications" && request.method === "GET") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        const notifs = await getNotifications(env, session.email);
        return new Response(JSON.stringify({ notifications: notifs.slice(0, 30) }), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/api/notifications/read" && request.method === "POST") {
        if (!session) return new Response(JSON.stringify({ error: "login required" }), { status: 401 });
        await markNotificationsRead(env, session.email);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }

      // NOTIFICATIONS PAGE — full list with All/Unread/type filters, touch-friendly.
      if (path === "/notifications" && request.method === "GET") {
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const branding = await getBranding(env);
        const filter = url.searchParams.get("filter") || "all";
        const notifs = await getNotifications(env, session.email);
        const typeGroups = { friend_requests: ["friend_request", "friend_accepted"], gifts: ["gift_received", "gift_sent", "gift_reversed"], purchases: ["purchase_completed", "download_completed"], system: ["system", "admin_adjustment", "account_reset"] };
        const filtered = filter === "all" ? notifs
          : filter === "unread" ? notifs.filter(n => !n.read)
          : notifs.filter(n => (typeGroups[filter] || [filter]).includes(n.type));
        const iconFor = (t) => ({ friend_request: "👥", friend_accepted: "✓", gift_received: "🎁", gift_sent: "🎁", gift_reversed: "↩", purchase_completed: "✓", download_completed: "⬇", admin_adjustment: "💰", account_reset: "⚠️", system: "🔔" }[t] || "🔔");
        const rows = filtered.length ? filtered.map(n => `
          <a class="notif-item notif-item-full ${!n.read ? "unread" : ""}" href="${n.actionUrl || "#"}">
            <span class="notif-icon">${iconFor(n.type)}</span>
            <div><div class="notif-text">${escapeHtml(n.text)}</div><div class="ntime">${timeAgo(new Date(n.time).toISOString())}</div></div>
          </a>`).join("") : `<div class="notif-empty" style="padding:30px;text-align:center;color:var(--text-dim);">Nothing here yet.</div>`;
        const filters = [["all", "All"], ["unread", "Unread"], ["friend_requests", "Friend Requests"], ["gifts", "Gifts"], ["purchases", "Purchases"], ["system", "System"]];
        const body = `
          <header>
            ${wordmarkHtml(branding)}
            <a class="nav-link" href="/">&larr; Back to home</a>
            <div class="user-menu">${themeToggleBtn()}<span class="coin-badge">💰${session.coins}</span></div>
          </header>
          <div class="perf"></div>
          <main>
            <h2 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin-top:14px;">🔔 Notifications</h2>
            <div class="admin-tabs">
              ${filters.map(([k, label]) => `<button class="admin-tab ${filter === k ? "active" : ""}" onclick="location.href='/notifications?filter=${k}'">${label}</button>`).join("")}
              <button class="admin-tab" onclick="fetch('/api/notifications/read',{method:'POST',credentials:'same-origin'}).then(()=>location.reload())">Mark all read</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;max-width:640px;margin-top:14px;">${rows}</div>
          </main>
          ${bottomNav(session, "notifications")}
          ${liveUpdateScript()}`;
        return new Response(shell(brandTitle(branding, "Notifications"), body, { music: true, spa: true, branding }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // CLAIMED TAB
      if (path === "/claimed" && request.method === "GET") {
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const purchasedIds = await getPurchases(env, session.email);
        const videos = await getVideos(env);
        const seriesList = await getSeriesList(env);
        const branding = await getBranding(env);
        const directVideos = purchasedIds.filter(i => !i.startsWith("series:")).map(id => videos.find(v => v.id === id)).filter(Boolean);
        const seriesIds = purchasedIds.filter(i => i.startsWith("series:")).map(i => i.slice(7));
        const seriesVideos = videos.filter(v => v.seriesId && seriesIds.includes(v.seriesId) && !directVideos.find(dv => dv.id === v.id));
        const claimedVideos = [...directVideos, ...seriesVideos].filter(v => v && !v.deleted);
        const cards = claimedVideos.map(v => `
          <a class="card" href="/watch?id=${encodeURIComponent(v.id)}">
            <div class="thumb-wrap">
              <img class="thumb" src="${escapeHtml(v.thumbnail)}" loading="lazy" alt="">
              <div class="claimed-badge">✓ Claimed</div>
              ${v.duration ? `<div class="duration-badge">${escapeHtml(v.duration)}</div>` : ""}
            </div>
            <div class="card-title">${escapeHtml(v.title)}</div>
          </a>`).join("");
        const body = `
          <header>
            ${wordmarkHtml(branding)}
            <a class="nav-link" href="/">&larr; Back to home</a>
            <div class="user-menu">${themeToggleBtn()}${notifBell()}<span class="coin-badge" id="coinBadge">💰${session.coins}</span></div>
          </header>
          <div class="perf"></div>
          <main>
            <h2 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin-top:14px;">🎬 Claimed Videos</h2>
            <p style="color:var(--text-dim);font-size:13px;">Videos you've purchased with coins, including full series packs. Only claimed paid videos are watchable here.</p>
            ${claimedVideos.length ? `<div class="grid">${cards}</div>` : `<div class="empty"><h2>Nothing claimed yet</h2><p>Purchase a paid video to see it here</p></div>`}
          </main>
          ${bottomNav(session, "claimed")}
          ${liveUpdateScript()}`;
        return new Response(shell(brandTitle(branding, "Claimed"), body, { music: true, spa: true, branding }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // COMMENT ADD
      if (path === "/comment/add" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        if (!session) return Response.redirect(url.origin + "/login", 303);
        const text = (form.get("text") || "").toString().trim().slice(0, 800);
        if (id && text) {
          if (isSpam(text)) return Response.redirect(url.origin + "/watch?id=" + encodeURIComponent(id) + "&msg=Comment%20blocked", 303);
          await addComment(env, id, session.name, text, session.email);
        }
        return Response.redirect(url.origin + "/watch?id=" + encodeURIComponent(id), 303);
      }

      // ADMIN: MAIN
      if (path === "/admin" && request.method === "GET") {
        const videos = await getVideos(env);
        const cats = await getCategories(env);
        const seriesList = await getSeriesList(env);
        const tab = url.searchParams.get("tab") || "users";
        const msg = url.searchParams.get("msg") || "";
        const usearch = (url.searchParams.get("usearch") || "").trim();
        const vq = (url.searchParams.get("vq") || "").trim();
        const vsort = (url.searchParams.get("vsort") || "newest").trim();
        const txuser = (url.searchParams.get("txuser") || "").trim();
        let users = await getAllUsers(env);
        const totalUsers = users.length;
        if (tab === "users") {
          users = await enrichUsers(env, users);
          if (usearch) {
            const needle = usearch.toLowerCase();
            users = users.filter(u =>
              (u.username || "").toLowerCase().includes(needle) ||
              (u.email || "").toLowerCase().includes(needle) ||
              (u.name || "").toLowerCase().includes(needle)
            );
          }
        }
        return new Response(await adminDashboard(videos, users, cats, seriesList, tab, msg, env, usearch, totalUsers, vq, vsort, txuser), {
          headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
      }

      // ADMIN: LIVE VIEWER COUNT (polled every 10s by the admin dashboard)
      if (path === "/admin/api/live-viewers" && request.method === "GET") {
        const result = await getOnlineCount(env);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }

      // ADMIN: TOGGLE A USER'S VERIFIED FLAG
      if (path === "/admin/user-verify" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const user = await getUser(env, email);
        if (user) {
          user.verified = !user.verified;
          await saveUser(env, user);
          let users2 = await getAllUsers(env);
          const idx2 = users2.findIndex(u => u.email === user.email);
          if (idx2 !== -1) { users2[idx2].verified = user.verified; await updateUsersList(env, users2); }
        }
        return Response.redirect(url.origin + "/admin?tab=users&msg=" + encodeURIComponent(user ? (user.verified ? "User verified" : "User unverified") : "User not found"), 303);
      }

      // ADMIN: SETTINGS
      if (path === "/admin/settings" && request.method === "POST") {
        const form = await request.formData();
        const current = await getSettings(env);
        const num = (k, def) => { const n = parseInt(form.get(k), 10); return isNaN(n) ? def : Math.max(0, n); };
        const isGoogleSection = (form.get("_section") || "") === "google";
        const settings = {
          ...current, // preserve siteMode (paid/free) — that's toggled separately via /admin/toggle-mode
          ...(isGoogleSection ? {} : {
            downloadCost: num("downloadCost", SETTINGS_DEFAULTS.downloadCost),
            referralSignupBonus: num("referralSignupBonus", SETTINGS_DEFAULTS.referralSignupBonus),
            referralPurchaseCommission: num("referralPurchaseCommission", SETTINGS_DEFAULTS.referralPurchaseCommission),
            dailyCheckinCoins: num("dailyCheckinCoins", SETTINGS_DEFAULTS.dailyCheckinCoins),
            activeTimeThresholdMinutes: Math.max(1, num("activeTimeThresholdMinutes", SETTINGS_DEFAULTS.activeTimeThresholdMinutes)),
            activeTimeBaseCoins: num("activeTimeBaseCoins", SETTINGS_DEFAULTS.activeTimeBaseCoins),
            activeTimeChunkMinutes: Math.max(1, num("activeTimeChunkMinutes", SETTINGS_DEFAULTS.activeTimeChunkMinutes)),
            activeTimeChunkCoins: num("activeTimeChunkCoins", SETTINGS_DEFAULTS.activeTimeChunkCoins),
            activeTimeDailyCapMinutes: Math.max(1, num("activeTimeDailyCapMinutes", SETTINGS_DEFAULTS.activeTimeDailyCapMinutes)),
            checkinStreakIntervalDays: num("checkinStreakIntervalDays", SETTINGS_DEFAULTS.checkinStreakIntervalDays),
            checkinStreakBonusCoins: num("checkinStreakBonusCoins", SETTINGS_DEFAULTS.checkinStreakBonusCoins),
            giftReverseWindowMinutes: num("giftReverseWindowMinutes", SETTINGS_DEFAULTS.giftReverseWindowMinutes),
            newUserStartingCoins: num("newUserStartingCoins", SETTINGS_DEFAULTS.newUserStartingCoins),
            // liveAnalyticsEnabled is no longer edited from this form — it now toggles
            // from the Analytics tab via /admin/analytics-toggle, so keep it unchanged here.
            showReleaseDate: form.get("showReleaseDate") === "on" // NEW — display-only toggle, never affects sorting/availability
          }),
          ...(isGoogleSection ? {
            googleClientId: (form.get("googleClientId") || "").toString().trim(),
            googleClientSecret: (form.get("googleClientSecret") || "").toString().trim()
          } : {})
        };
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=settings&msg=" + encodeURIComponent(isGoogleSection ? "Google credentials saved" : "Settings saved"), 303);
      }

      // ADMIN: AD BLOCKER PROTECTION toggle (Admin → 📢 Ads)
      if (path === "/admin/adblock/save" && request.method === "POST") {
        const form = await request.formData();
        const current = await getSettings(env);
        const settings = {
          ...current,
          adBlockProtectionEnabled: form.get("adBlockProtectionEnabled") === "on",
          adBlockProtectionMessage: sanitizeText(form.get("adBlockProtectionMessage"), 500) || SETTINGS_DEFAULTS.adBlockProtectionMessage,
          adBlockProtectionDismissible: form.get("adBlockProtectionDismissible") === "on"
        };
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=ads&msg=" + encodeURIComponent("Ad blocker settings saved"), 303);
      }

      // ADMIN: ACHIEVEMENTS / DAILY TASKS catalog (Admin → 🏆 Achievements)
      if (path === "/admin/achievements/save" && request.method === "POST") {
        const form = await request.formData();
        const current = await getSettings(env);
        const count = Math.max(0, parseInt(form.get("ach_count"), 10) || 0);
        const validStats = new Set(ACHIEVEMENT_STATS.map(s => s.key));
        const achievements = [];
        for (let i = 0; i < count; i++) {
          const id = (form.get(`ach_${i}_id`) || "").toString().trim();
          const label = sanitizeText(form.get(`ach_${i}_label`), 60);
          if (!id || !label) continue; // skip incomplete/removed rows
          const stat = (form.get(`ach_${i}_stat`) || "").toString();
          achievements.push({
            id,
            label,
            description: sanitizeText(form.get(`ach_${i}_description`), 160),
            stat: validStats.has(stat) ? stat : "watchHours",
            threshold: Math.max(0, Number(form.get(`ach_${i}_threshold`)) || 0),
            coins: Math.max(0, parseInt(form.get(`ach_${i}_coins`), 10) || 0),
            enabled: form.get(`ach_${i}_enabled`) === "on"
          });
        }
        const settings = {
          ...current,
          achievementsEnabled: form.get("achievementsEnabled") === "on",
          achievements: achievements.length ? achievements : current.achievements
        };
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=achievements&msg=" + encodeURIComponent("Achievements saved"), 303);
      }

      // ADMIN: SITE BRANDING (Brand / SEO / Theme / Footer / Social / Announcement / PWA)
      if (path === "/admin/branding" && request.method === "POST") {
        const form = await request.formData();
        const current = await getSettings(env);
        const settings = {
          ...current,
          siteName: sanitizeText(form.get("siteName"), 60) || SETTINGS_DEFAULTS.siteName,
          shortName: sanitizeText(form.get("shortName"), 20),
          siteLogo: sanitizeUrl(form.get("siteLogo")),
          mobileLogo: sanitizeUrl(form.get("mobileLogo")),
          faviconUrl: sanitizeUrl(form.get("faviconUrl")),
          siteDescription: sanitizeText(form.get("siteDescription"), 300),
          browserTitle: sanitizeText(form.get("browserTitle"), 80) || SETTINGS_DEFAULTS.browserTitle,
          seoTitle: sanitizeText(form.get("seoTitle"), 80),
          seoDescription: sanitizeText(form.get("seoDescription"), 300),
          seoKeywords: sanitizeText(form.get("seoKeywords"), 300),
          siteUrl: sanitizeUrl(form.get("siteUrl")),
          canonicalUrl: sanitizeUrl(form.get("canonicalUrl")),
          ogImage: sanitizeUrl(form.get("ogImage")),
          defaultTheme: ["dark", "light", "system"].includes(form.get("defaultTheme")) ? form.get("defaultTheme") : "dark",
          accentColor: sanitizeHexColor(form.get("accentColor"), SETTINGS_DEFAULTS.accentColor),
          pwaThemeColor: sanitizeHexColor(form.get("pwaThemeColor"), ""),
          pwaBackgroundColor: sanitizeHexColor(form.get("pwaBackgroundColor"), SETTINGS_DEFAULTS.pwaBackgroundColor),
          footerText: sanitizeText(form.get("footerText"), 400),
          copyrightText: sanitizeText(form.get("copyrightText"), 200),
          autoCopyrightYear: form.get("autoCopyrightYear") === "on",
          socialLinks: {
            facebook: sanitizeUrl(form.get("social_facebook")),
            instagram: sanitizeUrl(form.get("social_instagram")),
            youtube: sanitizeUrl(form.get("social_youtube")),
            telegram: sanitizeUrl(form.get("social_telegram")),
            twitter: sanitizeUrl(form.get("social_twitter"))
          },
          announcementEnabled: form.get("announcementEnabled") === "on",
          announcementText: sanitizeText(form.get("announcementText"), 200),
          announcementUrl: sanitizeUrl(form.get("announcementUrl")),
          pwaName: sanitizeText(form.get("pwaName"), 60),
          pwaShortName: sanitizeText(form.get("pwaShortName"), 20),
          pwaIcon: sanitizeUrl(form.get("pwaIcon"))
        };
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=branding&msg=" + encodeURIComponent("Branding saved"), 303);
      }

      // ADMIN: RESET BRANDING TO DEFAULTS (leaves every other setting — coin
      // amounts, download cost, background music, etc. — untouched)
      if (path === "/admin/branding/reset-defaults" && request.method === "POST") {
        const current = await getSettings(env);
        const brandingKeys = [
          "siteName", "shortName", "siteLogo", "mobileLogo", "faviconUrl", "siteDescription",
          "browserTitle", "seoTitle", "seoDescription", "seoKeywords", "siteUrl", "canonicalUrl", "ogImage",
          "defaultTheme", "accentColor", "pwaThemeColor", "pwaBackgroundColor",
          "footerText", "copyrightText", "autoCopyrightYear", "socialLinks",
          "announcementEnabled", "announcementText", "announcementUrl",
          "pwaName", "pwaShortName", "pwaIcon"
        ];
        const settings = { ...current };
        for (const k of brandingKeys) settings[k] = SETTINGS_DEFAULTS[k];
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=branding&msg=" + encodeURIComponent("Branding reset to defaults"), 303);
      }

      // ADMIN: BACKGROUND MUSIC SETTINGS (NEW — Feature: Site Background Music)
      if (path === "/admin/music-settings" && request.method === "POST") {
        const form = await request.formData();
        const current = await getSettings(env);
        const volRaw = parseFloat(form.get("volume"));
        const settings = {
          ...current,
          backgroundMusic: {
            enabled: form.get("enabled") === "on",
            driveId: (form.get("driveId") || "").toString().trim(),
            title: (form.get("title") || "").toString().trim(),
            loop: form.get("loop") === "on",
            volume: isNaN(volRaw) ? 0.35 : Math.min(1, Math.max(0, volRaw)),
            autoplay: form.get("autoplay") === "on"
          }
        };
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=music&msg=" + encodeURIComponent("Background music settings saved"), 303);
      }

      // ADMIN: PLAYER SETTINGS (NEW — Feature: Reel player skin + ad breaks)
      if (path === "/admin/player-settings" && request.method === "POST") {
        const form = await request.formData();
        const current = await getSettings(env);
        const clampInt = (raw, min, max, fallback) => {
          const n = parseInt(raw, 10);
          return isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
        };
        const settings = {
          ...current,
          player: {
            ...current.player,
            adsEnabled: form.get("adsEnabled") === "on",
            prerollSeconds: clampInt(form.get("prerollSeconds"), 1, 120, current.player.prerollSeconds),
            midrollSeconds: clampInt(form.get("midrollSeconds"), 1, 120, current.player.midrollSeconds),
            midrollAtPercent: clampInt(form.get("midrollAtPercent"), 1, 99, current.player.midrollAtPercent),
            skipAfterSeconds: clampInt(form.get("skipAfterSeconds"), 0, 60, current.player.skipAfterSeconds),
            adHeadline: sanitizeText(form.get("adHeadline"), 80) || current.player.adHeadline,
            adSubtext: sanitizeText(form.get("adSubtext"), 140) || current.player.adSubtext,
            keyboardShortcuts: form.get("keyboardShortcuts") === "on",
            reelAnimation: form.get("reelAnimation") === "on",
            showSpeedControl: form.get("showSpeedControl") === "on",
            resumePlayback: form.get("resumePlayback") === "on",
            autoNextDefault: form.get("autoNextDefault") === "on"
          }
        };
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=player&msg=" + encodeURIComponent("Player settings saved"), 303);
      }

      // ADMIN: ONE-CLICK PAID/FREE MODE TOGGLE
      if (path === "/admin/toggle-mode" && request.method === "POST") {
        const settings = await getSettings(env);
        settings.siteMode = isFreeMode(settings) ? "paid" : "free";
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=settings&msg=" + encodeURIComponent("Switched to " + (settings.siteMode === "free" ? "Free" : "Paid") + " Mode"), 303);
      }

      // ADMIN: LIVE ANALYTICS TOGGLE (moved here from Settings tab — now
      // lives directly on the Analytics tab as an on/off switch).
      if (path === "/admin/analytics-toggle" && request.method === "POST") {
        const form = await request.formData();
        const newValue = (form.get("liveAnalyticsEnabled") || "").toString() === "true";
        const settings = await getSettings(env);
        settings.liveAnalyticsEnabled = newValue;
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=analytics&msg=" + encodeURIComponent("Live Analytics is now " + (newValue ? "ON" : "OFF")), 303);
      }

      // ADMIN: ACCESS CONTROL TOGGLE (Admin panel form — see the JSON API
      // below at /api/admin/access-control for programmatic access to the
      // same setting).
      if (path === "/admin/access-control" && request.method === "POST") {
        const form = await request.formData();
        const newValue = (form.get("accountRequired") || "").toString() !== "false";
        const settings = await getSettings(env);
        const oldValue = isAccountRequired(settings);
        settings.accountRequired = newValue;
        await saveSettings(env, settings);
        if (oldValue !== newValue) {
          await addAdminAuditLog(env, "admin", "access_control_changed", "settings.accountRequired", `oldValue=${oldValue} newValue=${newValue}`);
        }
        return Response.redirect(url.origin + "/admin?tab=access&msg=" + encodeURIComponent("Account Required is now " + (newValue ? "ON" : "OFF")), 303);
      }

      // API: ACCESS CONTROL — admin-protected read/write for the
      // accountRequired setting. Requires a valid admin_session cookie (the
      // top-level /api/admin/ gate above already enforces this before this
      // handler ever runs; normal users/guests get a 403 there and never
      // reach this code). Only ever reads/writes the single known boolean —
      // no arbitrary client-supplied KV keys are accepted.
      if (path === "/api/admin/access-control" && request.method === "GET") {
        const settings = await getSettings(env);
        return new Response(JSON.stringify({ accountRequired: isAccountRequired(settings) }), { headers: { "Content-Type": "application/json" } });
      }
      if (path === "/api/admin/access-control" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (typeof body.accountRequired !== "boolean") {
          return new Response(JSON.stringify({ error: "accountRequired must be a boolean" }), { status: 400 });
        }
        const settings = await getSettings(env);
        const oldValue = isAccountRequired(settings);
        const newValue = body.accountRequired;
        settings.accountRequired = newValue;
        await saveSettings(env, settings);
        if (oldValue !== newValue) {
          await addAdminAuditLog(env, "admin", "access_control_changed", "settings.accountRequired", `oldValue=${oldValue} newValue=${newValue}`);
        }
        return new Response(JSON.stringify({ accountRequired: newValue }), { headers: { "Content-Type": "application/json" } });
      }

      // ADMIN: RESET ONE USER'S LOCAL DATA (bumps their personal token; the
      // client picks this up on its next /api/balance poll and self-clears)
      if (path === "/admin/user-reset-local" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const user = await getUser(env, email);
        if (user) {
          user.localResetToken = (user.localResetToken || 0) + 1;
          await saveUser(env, user);
        }
        return Response.redirect(url.origin + "/admin?tab=users&msg=" + encodeURIComponent("Local data reset queued for " + (user ? user.username : email)), 303);
      }

      // ADMIN: RESET *ALL* USERS' LOCAL DATA (bumps the site-wide token —
      // every logged-in client self-clears on its next poll)
      if (path === "/admin/reset-all-local" && request.method === "POST") {
        const settings = await getSettings(env);
        settings.globalLocalResetToken = (settings.globalLocalResetToken || 0) + 1;
        await saveSettings(env, settings);
        return Response.redirect(url.origin + "/admin?tab=settings&msg=" + encodeURIComponent("All users' local data will reset on their next visit"), 303);
      }

      // ADMIN: ADD VIDEO
      if (path === "/admin/add" && request.method === "POST") {
        const form = await request.formData();
        const title = (form.get("title") || "").toString().trim();
        const driveId = (form.get("driveId") || "").toString().trim();
        const thumbnail = (form.get("thumbnail") || "").toString().trim();
        const duration = (form.get("duration") || "").toString().trim();
        const category = (form.get("category") || "").toString().trim();
        const subCategory = (form.get("subCategory") || "").toString().trim();
        const description = (form.get("description") || "").toString().trim();
        const coinCost = Math.max(0, parseInt(form.get("coinCost") || "5", 10) || 0);
        const seriesId = (form.get("seriesId") || "").toString().trim();
        const part = Math.max(1, parseInt(form.get("part") || "1", 10) || 1);
        const publishAtRaw = (form.get("publishAt") || "").toString().trim();
        const publishAt = publishAtRaw ? new Date(publishAtRaw).getTime() : null;
        // Release Date (NEW) — distinct from publishAt; display-only "actual release
        // date", date-only (YYYY-MM-DD). Kept as a plain string, never touches createdAt.
        const releaseDateRaw = (form.get("releaseDate") || "").toString().trim();
        const releaseDate = /^\d{4}-\d{2}-\d{2}$/.test(releaseDateRaw) ? releaseDateRaw : null;
        const draft = form.get("draft") === "on";
        if (!title || !driveId || !thumbnail) {
          const videos = await getVideos(env); const users = await getAllUsers(env); const cats = await getCategories(env); const seriesList = await getSeriesList(env);
          return new Response(await adminDashboard(videos, users, cats, seriesList, "add", "Title, Drive ID, and thumbnail are required.", env), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }
        const videos = await getVideos(env);
        videos.unshift({
          id: crypto.randomUUID(), title, driveId, thumbnail, duration, category, subCategory, description, coinCost,
          seriesId: seriesId || null, part: seriesId ? part : null,
          publishAt: publishAt || null, releaseDate, hidden: false, draft, deleted: false, createdAt: Date.now()
        });
        await saveVideos(env, videos);
        return Response.redirect(url.origin + "/admin?tab=videos", 303);
      }

      // ADMIN: EDIT VIDEO GET
      if (path === "/admin/edit" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const videos = await getVideos(env);
        const video = videos.find((v) => v.id === id);
        if (!video) return new Response("Video not found", { status: 404 });
        const cats = await getCategories(env);
        const seriesList = (await getSeriesList(env)).filter(s => !s.deleted);
        return new Response(editVideoPage(video, cats, seriesList, null), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // ADMIN: EDIT VIDEO POST
      if (path === "/admin/edit" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const title = (form.get("title") || "").toString().trim();
        const driveId = (form.get("driveId") || "").toString().trim();
        const thumbnail = (form.get("thumbnail") || "").toString().trim();
        const duration = (form.get("duration") || "").toString().trim();
        const category = (form.get("category") || "").toString().trim();
        const subCategory = (form.get("subCategory") || "").toString().trim();
        const description = (form.get("description") || "").toString().trim();
        const coinCost = Math.max(0, parseInt(form.get("coinCost") || "0", 10) || 0);
        const seriesId = (form.get("seriesId") || "").toString().trim();
        const part = Math.max(1, parseInt(form.get("part") || "1", 10) || 1);
        const publishAtRaw = (form.get("publishAt") || "").toString().trim();
        const publishAt = publishAtRaw ? new Date(publishAtRaw).getTime() : null;
        const releaseDateRaw = (form.get("releaseDate") || "").toString().trim();
        const releaseDate = /^\d{4}-\d{2}-\d{2}$/.test(releaseDateRaw) ? releaseDateRaw : null;
        // partOrder (NEW, Part 13) — explicit series-part position, optional. Blank
        // clears it back to null, which falls back to upload-date ordering in
        // sortByUploadOrder — this is how old data (and any part nobody has
        // manually reordered) keeps behaving exactly as before.
        const partOrderRaw = (form.get("partOrder") || "").toString().trim();
        const partOrder = partOrderRaw !== "" && !isNaN(parseInt(partOrderRaw, 10)) ? Math.max(1, parseInt(partOrderRaw, 10)) : null;
        const draft = form.get("draft") === "on";
        const videos = await getVideos(env);
        const idx = videos.findIndex((v) => v.id === id);
        if (idx === -1) return new Response("Video not found", { status: 404 });
        if (!title || !driveId || !thumbnail) {
          const cats = await getCategories(env); const seriesList = (await getSeriesList(env)).filter(s => !s.deleted);
          return new Response(editVideoPage(videos[idx], cats, seriesList, "All fields are required."), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }
        videos[idx] = { ...videos[idx], title, driveId, thumbnail, duration, category, subCategory, description, coinCost, seriesId: seriesId || null, part: seriesId ? part : null, partOrder, publishAt: publishAt || null, releaseDate, draft };
        await saveVideos(env, videos);
        return Response.redirect(url.origin + "/admin?tab=videos", 303);
      }

      // ADMIN: SOFT-DELETE VIDEO (move to Trash)
      if (path === "/admin/soft-delete" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const videos = await getVideos(env);
        const idx = videos.findIndex(v => v.id === id);
        if (idx !== -1) { videos[idx].deleted = true; videos[idx].deletedAt = Date.now(); await saveVideos(env, videos); }
        return Response.redirect(url.origin + "/admin?tab=videos&msg=Moved+to+trash", 303);
      }

      // ADMIN: HIDE/UNHIDE VIDEO (NEW — Feature: Hide/Unhide, works for both
      // standalone movies and individual series parts, same video object)
      if (path === "/admin/video-hide-toggle" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const back = (form.get("back") || "videos").toString();
        const videos = await getVideos(env);
        const idx = videos.findIndex(v => v.id === id);
        if (idx !== -1) { videos[idx].hidden = !videos[idx].hidden; await saveVideos(env, videos); }
        return Response.redirect(url.origin + "/admin?tab=" + encodeURIComponent(back) + "&msg=" + encodeURIComponent(idx !== -1 && videos[idx].hidden ? "Video hidden" : "Video visible again"), 303);
      }

      // ADMIN: DRAFT/PUBLISH TOGGLE (NEW — Feature: Video Draft Mode).
      // A draft video is saved but never publicly visible (same enforcement
      // point as isPublished — hidden from listings, search, related, watch-
      // later, watch page) regardless of publishAt, until an admin publishes
      // it. Direct /watch links for drafts are still blocked, unlike hidden
      // videos, since a draft may be incomplete/unready for anyone to see.
      if (path === "/admin/video-draft-toggle" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const back = (form.get("back") || "videos").toString();
        const videos = await getVideos(env);
        const idx = videos.findIndex(v => v.id === id);
        if (idx !== -1) { videos[idx].draft = !videos[idx].draft; await saveVideos(env, videos); }
        return Response.redirect(url.origin + "/admin?tab=" + encodeURIComponent(back) + "&msg=" + encodeURIComponent(idx !== -1 && videos[idx].draft ? "Video saved as draft" : "Video published"), 303);
      }

      // ADMIN: RESTORE VIDEO FROM TRASH
      if (path === "/admin/restore" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const videos = await getVideos(env);
        const idx = videos.findIndex(v => v.id === id);
        if (idx !== -1) { videos[idx].deleted = false; delete videos[idx].deletedAt; await saveVideos(env, videos); }
        return Response.redirect(url.origin + "/admin?tab=trash&msg=Restored", 303);
      }

      // ADMIN: PERMANENTLY DELETE VIDEO (danger zone — from Trash only)
      if (path === "/admin/delete" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        let videos = await getVideos(env);
        videos = videos.filter((v) => v.id !== id);
        await saveVideos(env, videos);
        return Response.redirect(url.origin + "/admin?tab=trash&msg=Deleted+permanently", 303);
      }

      // ADMIN: RESET VIEWS
      if (path === "/admin/reset-views" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        await resetViews(env, id);
        return Response.redirect(url.origin + "/admin?tab=videos&msg=Views+reset", 303);
      }

      // ADMIN: SET VIEWS (exact count)
      if (path === "/admin/set-views" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const views = Math.max(0, parseInt(form.get("views") || "0", 10) || 0);
        await env.VIDEOS.put("views:" + id, JSON.stringify({ count: views, viewedBy: [] }));
        return Response.redirect(url.origin + "/admin?tab=videos&msg=Views+updated", 303);
      }

      // ADMIN: RESET LIKES
      if (path === "/admin/reset-likes" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        await resetLikes(env, id);
        return Response.redirect(url.origin + "/admin?tab=videos&msg=Likes+reset", 303);
      }

      // ADMIN: SET LIKES/DISLIKES (exact counts)
      if (path === "/admin/set-likes" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const likes = Math.max(0, parseInt(form.get("likes") || "0", 10) || 0);
        const dislikes = Math.max(0, parseInt(form.get("dislikes") || "0", 10) || 0);
        await saveLikeData(env, id, { likes, dislikes, likedBy: [], dislikedBy: [] });
        return Response.redirect(url.origin + "/admin?tab=videos&msg=Likes+updated", 303);
      }

      // ADMIN: BAN/UNBAN USER
      if (path === "/admin/user-ban" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        let users = await getAllUsers(env);
        const idx = users.findIndex((u) => u.email === email);
        if (idx !== -1) {
          users[idx].isBanned = !users[idx].isBanned;
          await updateUsersList(env, users);
          const user = await getUser(env, email);
          if (user) { user.isBanned = users[idx].isBanned; await saveUser(env, user); }
        }
        return Response.redirect(url.origin + "/admin?tab=users", 303);
      }

      // ADMIN: SET COINS (absolute)
      if (path === "/admin/user-coins" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const coins = parseInt(form.get("coins") || "0", 10);
        if (!isNaN(coins)) {
          const user = await getUser(env, email);
          if (user) {
            const delta = coins - (user.coins || 0);
            await adjustUserCoins(env, email, delta, "Balance set by admin");
          }
        }
        return Response.redirect(url.origin + "/admin?tab=users&msg=Coins+updated", 303);
      }

      // ADMIN: ADD/DEDUCT COINS (delta)
      if (path === "/admin/user-coins-adjust" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const action = (form.get("action") || "").toString();
        const amount = Math.abs(parseInt(form.get("amount") || "0", 10) || 0);
        if (amount > 0) {
          const delta = action === "deduct" ? -amount : amount;
          await adjustUserCoins(env, email, delta, action === "deduct" ? "Coins deducted by admin" : "Coins added by admin");
        }
        return Response.redirect(url.origin + "/admin?tab=users&msg=Coins+updated", 303);
      }

      // ADMIN: DELETE USER
      if (path === "/admin/user-delete" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        await deleteUserFully(env, email);
        return Response.redirect(url.origin + "/admin?tab=users&msg=User+deleted", 303);
      }

      // ADMIN: ADD USER
      if (path === "/admin/user-add" && request.method === "POST") {
        const form = await request.formData();
        const name = (form.get("name") || "").toString().trim().slice(0, 60);
        const username = (form.get("username") || "").toString().trim().toLowerCase();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const password = (form.get("password") || "").toString();
        const coins = parseInt(form.get("coins") || "50", 10);
        if (!name || !username || !email || !password)
          return Response.redirect(url.origin + "/admin?tab=adduser&msg=All+fields+required", 303);
        const existing = await getUser(env, email);
        if (existing) return Response.redirect(url.origin + "/admin?tab=adduser&msg=Email+already+registered", 303);
        const userCheck = await env.VIDEOS.get("user_username:" + username);
        if (userCheck) return Response.redirect(url.origin + "/admin?tab=adduser&msg=Username+taken", 303);
        const user = await createUser(env, email, username, name, password);
        user.coins = isNaN(coins) ? 50 : coins;
        await saveUser(env, user);
        const users = await getAllUsers(env);
        users.push({ email: user.email, username: user.username, name: user.name, coins: user.coins, isBanned: false });
        await updateUsersList(env, users);
        return Response.redirect(url.origin + "/admin?tab=users&msg=User+created", 303);
      }

      // ADMIN: ADS — save (create or update), toggle, delete. Admin-only (gated
      // above); normal users never see these routes or ad-management APIs.
      if (path === "/admin/ads/save" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const name = sanitizeText(form.get("name") || "", 80) || "Untitled Ad";
        const type = (form.get("type") || "html").toString() === "image" ? "image" : "html";
        const code = (form.get("code") || "").toString().slice(0, 20000); // trusted admin-only HTML/JS/image URL
        const placement = AD_PLACEMENTS.includes((form.get("placement") || "").toString()) ? form.get("placement").toString() : "home";
        const priority = parseInt(form.get("priority") || "0", 10) || 0;
        const startDate = (form.get("startDate") || "").toString() || null;
        const endDate = (form.get("endDate") || "").toString() || null;
        const ads = await getAds(env);
        if (id) {
          const idx = ads.findIndex(a => a.id === id);
          if (idx !== -1) {
            ads[idx] = { ...ads[idx], name, type, code, placement, priority, startDate, endDate, updatedAt: Date.now() };
            await addAdminAuditLog(env, "admin", "AD_EDIT", name, `id=${id}`);
          }
        } else {
          ads.push({ id: crypto.randomUUID(), name, type, code, placement, priority, status: "active", startDate, endDate, createdAt: Date.now(), updatedAt: Date.now() });
          await addAdminAuditLog(env, "admin", "AD_CREATE", name, "");
        }
        await saveAds(env, ads);
        return Response.redirect(url.origin + "/admin?tab=ads&msg=Ad+saved", 303);
      }
      if (path === "/admin/ads/toggle" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const ads = await getAds(env);
        const idx = ads.findIndex(a => a.id === id);
        if (idx !== -1) {
          ads[idx].status = ads[idx].status === "active" ? "disabled" : "active";
          ads[idx].updatedAt = Date.now();
          await saveAds(env, ads);
          await addAdminAuditLog(env, "admin", "AD_TOGGLE", ads[idx].name, ads[idx].status);
        }
        return Response.redirect(url.origin + "/admin?tab=ads", 303);
      }
      if (path === "/admin/ads/delete" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const ads = await getAds(env);
        const idx = ads.findIndex(a => a.id === id);
        if (idx !== -1) {
          const removed = ads.splice(idx, 1)[0];
          await saveAds(env, ads);
          await addAdminAuditLog(env, "admin", "AD_DELETE", removed.name, "");
        }
        return Response.redirect(url.origin + "/admin?tab=ads&msg=Ad+deleted", 303);
      }

      // ADMIN: COMMENTS PAGE
      // ADMIN: USER DETAILS
      if (path === "/admin/user" && request.method === "GET") {
        const email = (url.searchParams.get("email") || "").toString().trim().toLowerCase();
        const user = email ? await getUser(env, email) : null;
        if (!user) return Response.redirect(url.origin + "/admin?tab=users&msg=User+not+found", 303);
        const msg = url.searchParams.get("msg") || "";
        return new Response(await adminUserDetailsPage(env, user, msg), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // ADMIN: COMPLETE ACCOUNT RESET
      if (path === "/admin/user-complete-reset" && request.method === "POST") {
        const form = await request.formData();
        const email = (form.get("email") || "").toString().trim().toLowerCase();
        const result = await completeAccountReset(env, email, "admin");
        if (!result.success) return Response.redirect(url.origin + "/admin?tab=users&msg=" + encodeURIComponent(result.error || "Reset failed"), 303);
        return Response.redirect(url.origin + "/admin/user?email=" + encodeURIComponent(email) + "&msg=" + encodeURIComponent("Account completely reset"), 303);
      }

      if (path === "/admin/comments" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const videos = await getVideos(env);
        const video = videos.find(v => v.id === id);
        if (!video) return new Response("Video not found", { status: 404 });
        const comments = await getComments(env, id);
        const msg = url.searchParams.get("msg") || "";
        return new Response(await adminCommentsPage(video, comments, msg), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // ADMIN: ADD COMMENT (as Admin)
      if (path === "/admin/comment-add" && request.method === "POST") {
        const form = await request.formData();
        const videoId = (form.get("videoId") || "").toString();
        const text = (form.get("text") || "").toString().trim().slice(0, 800);
        if (videoId && text) {
          const list = await getComments(env, videoId);
          const cid = crypto.randomUUID();
          list.unshift({ id: cid, name: "Admin", text, userId: "admin", isAdmin: true, time: new Date().toISOString() });
          await env.VIDEOS.put("comments:" + videoId, JSON.stringify(list));
        }
        return Response.redirect(url.origin + "/admin/comments?id=" + encodeURIComponent(videoId) + "&msg=Comment+added", 303);
      }

      // ADMIN: DELETE COMMENT
      if (path === "/admin/comment-delete" && request.method === "POST") {
        const form = await request.formData();
        const videoId = (form.get("videoId") || "").toString();
        const commentId = (form.get("commentId") || "").toString();
        await deleteComment(env, videoId, commentId);
        return Response.redirect(url.origin + "/admin/comments?id=" + encodeURIComponent(videoId) + "&msg=Comment+deleted", 303);
      }

      // ADMIN: EDIT COMMENT
      if (path === "/admin/comment-edit" && request.method === "POST") {
        const form = await request.formData();
        const videoId = (form.get("videoId") || "").toString();
        const commentId = (form.get("commentId") || "").toString();
        const text = (form.get("text") || "").toString().trim().slice(0, 800);
        if (text) await editComment(env, videoId, commentId, text);
        return Response.redirect(url.origin + "/admin/comments?id=" + encodeURIComponent(videoId) + "&msg=Comment+updated", 303);
      }

      // ADMIN: CATEGORIES
      if (path === "/admin/categories" && request.method === "POST") {
        const form = await request.formData();
        const category = (form.get("category") || "").toString().trim();
        if (category) {
          let cats = await getCategories(env);
          if (!cats.find(c => c.name === category)) { cats.push({ name: category, subs: [] }); await saveCategories(env, cats); }
        }
        return Response.redirect(url.origin + "/admin?tab=categories", 303);
      }

      // ADMIN: DELETE CATEGORY
      if (path === "/admin/category-delete" && request.method === "POST") {
        const form = await request.formData();
        const category = (form.get("category") || "").toString().trim();
        let cats = await getCategories(env);
        cats = cats.filter(c => c.name !== category);
        await saveCategories(env, cats);
        return Response.redirect(url.origin + "/admin?tab=categories", 303);
      }

      // ADMIN: SHOW/HIDE CATEGORY (one-click — hides the tab and its videos from users)
      if (path === "/admin/category-toggle-visibility" && request.method === "POST") {
        const form = await request.formData();
        const category = (form.get("category") || "").toString().trim();
        let cats = await getCategories(env);
        const idx = cats.findIndex(c => c.name === category);
        if (idx !== -1) { cats[idx].hidden = !cats[idx].hidden; await saveCategories(env, cats); }
        return Response.redirect(url.origin + "/admin?tab=categories", 303);
      }

      // ADMIN: ADD SUB-CATEGORY
      if (path === "/admin/subcategory-add" && request.method === "POST") {
        const form = await request.formData();
        const category = (form.get("category") || "").toString().trim();
        const sub = (form.get("sub") || "").toString().trim();
        if (category && sub) {
          let cats = await getCategories(env);
          const idx = cats.findIndex(c => c.name === category);
          if (idx !== -1 && !cats[idx].subs.includes(sub)) { cats[idx].subs.push(sub); await saveCategories(env, cats); }
        }
        return Response.redirect(url.origin + "/admin?tab=categories", 303);
      }

      // ADMIN: DELETE SUB-CATEGORY
      if (path === "/admin/subcategory-delete" && request.method === "POST") {
        const form = await request.formData();
        const category = (form.get("category") || "").toString().trim();
        const sub = (form.get("sub") || "").toString().trim();
        let cats = await getCategories(env);
        const idx = cats.findIndex(c => c.name === category);
        if (idx !== -1) { cats[idx].subs = cats[idx].subs.filter(s => s !== sub); await saveCategories(env, cats); }
        return Response.redirect(url.origin + "/admin?tab=categories", 303);
      }

      // ADMIN: SERIES CREATE — appended (push), not prepended, so the series
      // list is always stored oldest → newest and every page that iterates
      // it in stored order automatically shows "old to newest".
      if (path === "/admin/series-add" && request.method === "POST") {
        const form = await request.formData();
        const title = (form.get("title") || "").toString().trim();
        if (title) {
          const list = await getSeriesList(env);
          list.push({ id: crypto.randomUUID(), title, coinCost: 0, deleted: false, createdAt: Date.now() });
          await saveSeriesList(env, list);
        }
        return Response.redirect(url.origin + "/admin?tab=series", 303);
      }

      // ADMIN: SERIES SET BUNDLE PRICE
      if (path === "/admin/series-coincost" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const coinCost = Math.max(0, parseInt(form.get("coinCost") || "0", 10) || 0);
        const list = await getSeriesList(env);
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) { list[idx].coinCost = coinCost; await saveSeriesList(env, list); }
        return Response.redirect(url.origin + "/admin?tab=series&msg=Series+updated", 303);
      }

      // ADMIN: SERIES RENAME (NEW — Feature: Series Admin Management)
      if (path === "/admin/series-rename" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const title = (form.get("title") || "").toString().trim();
        const list = await getSeriesList(env);
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1 && title) { list[idx].title = title; await saveSeriesList(env, list); }
        return Response.redirect(url.origin + "/admin?tab=series&msg=" + encodeURIComponent(title ? "Series renamed" : "Title cannot be empty"), 303);
      }

      // ADMIN: SERIES HIDE/UNHIDE (NEW — hides the whole series, and every
      // one of its parts, from public listings; direct links still work,
      // same precedent as hidden categories/videos)
      if (path === "/admin/series-hide-toggle" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const list = await getSeriesList(env);
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) { list[idx].hidden = !list[idx].hidden; await saveSeriesList(env, list); }
        return Response.redirect(url.origin + "/admin?tab=series&msg=" + encodeURIComponent(idx !== -1 && list[idx].hidden ? "Series hidden" : "Series visible again"), 303);
      }

      // ADMIN: SERIES SOFT-DELETE (move to Trash — videos stay linked and
      // untouched so restoring brings the series back exactly as it was)
      if (path === "/admin/series-delete" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const list = await getSeriesList(env);
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) { list[idx].deleted = true; list[idx].deletedAt = Date.now(); await saveSeriesList(env, list); }
        return Response.redirect(url.origin + "/admin?tab=series&msg=Moved+to+trash", 303);
      }

      // ADMIN: SERIES RESTORE FROM TRASH
      if (path === "/admin/series-restore" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        const list = await getSeriesList(env);
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) { list[idx].deleted = false; delete list[idx].deletedAt; await saveSeriesList(env, list); }
        return Response.redirect(url.origin + "/admin?tab=trash&msg=Series+restored", 303);
      }

      // ADMIN: SERIES PERMANENT DELETE (danger zone — from Trash only;
      // unlinks videos from it, does not delete the videos themselves)
      if (path === "/admin/series-delete-permanent" && request.method === "POST") {
        const form = await request.formData();
        const id = (form.get("id") || "").toString();
        let list = await getSeriesList(env);
        list = list.filter(s => s.id !== id);
        await saveSeriesList(env, list);
        const videos = await getVideos(env);
        let changed = false;
        for (const v of videos) { if (v.seriesId === id) { v.seriesId = null; v.part = null; changed = true; } }
        if (changed) await saveVideos(env, videos);
        return Response.redirect(url.origin + "/admin?tab=trash&msg=Series+deleted+permanently", 303);
      }

      // WATCH LATER
      if (path === "/watchlater" && request.method === "GET") {
        const branding = await getBranding(env);
        const body = `
          <header>
            ${wordmarkHtml(branding)}
            <a class="nav-link" href="/">&larr; Back to home</a>
            <div class="user-menu">${themeToggleBtn()}</div>
          </header>
          <div class="perf"></div>
          <main>
            <h2 style="font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px;margin-top:14px;">📌 Watch Later</h2>
            <div id="wlGrid" class="grid" style="margin-top:18px;"></div>
            <div id="wlEmpty" class="empty" style="display:none;"><h2>Nothing saved</h2><p>Tap ☆ on any video to save for later</p></div>
          </main>
          ${bottomNav(session, "watchlater")}
          <script>
            async function loadWatchLater() {
              let ids = [];
              try { ids = JSON.parse(localStorage.getItem('watchlater') || '[]'); } catch (e) {}
              if (!ids.length) { document.getElementById('wlEmpty').style.display = 'block'; return; }
              const res = await fetch('/api/videos?ids=' + ids.map(encodeURIComponent).join(','));
              const videos = await res.json();
              const grid = document.getElementById('wlGrid');
              if (!videos.length) { document.getElementById('wlEmpty').style.display = 'block'; return; }
              grid.innerHTML = videos.map(v => \`
                <a class="card" href="/watch?id=\${encodeURIComponent(v.id)}">
                  <div class="thumb-wrap">
                    <img class="thumb" src="\${v.thumbnail}" loading="lazy" alt="">
                    \${v.duration ? '<div class="duration-badge">' + v.duration + '</div>' : ''}
                  </div>
                  <div class="card-title">\${v.title}</div>
                </a>\`).join('');
            }
            loadWatchLater();
          </script>`;
        return new Response(shell(brandTitle(branding, "Watch Later"), body, { music: !!session, spa: !!session, branding }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      // API: VIDEOS (watch later / continue watching lookup) — only published, non-deleted
      if (path === "/api/videos" && request.method === "GET") {
        const idsParam = url.searchParams.get("ids") || "";
        const ids = idsParam.split(",").filter(Boolean);
        const videos = await getVideos(env);
        const matched = ids.map(id => videos.find(v => v.id === id)).filter(v => v && isPublished(v));
        return new Response(JSON.stringify(matched), { headers: { "Content-Type": "application/json" } });
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      return new Response("Server error: " + err.message, { status: 500 });
    }
  }
};