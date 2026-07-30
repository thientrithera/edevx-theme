/* ======================================================== */
/* EDUCATION DEVX - CORE JAVASCRIPT (V1.0 MASTER)           */
/* ======================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. CORE ENGINE & UI ---
    document.getElementById('current-year').textContent = new Date().getFullYear();
    const html = document.documentElement;
    if (localStorage.getItem('theme') === 'dark') html.classList.add('dark'); else { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    
    ['dark-mode-toggle', 'dark-mode-toggle-mobile'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', () => { html.classList.toggle('dark'); localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light'); });
    });
    
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if(mobileBtn && mobileMenu) mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

    // PWA Service Worker Inline
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swCode = `const CACHE_NAME='edevx-offline-v1';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(res=>{const resClone=res.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,resClone));return res;}).catch(()=>caches.match(e.request)));});`;
            try { navigator.serviceWorker.register(URL.createObjectURL(new Blob([swCode], {type: 'text/javascript'}))).catch(()=>{}); } catch(e){}
        });
    }

    // Font Size & Reading Time
    const articleBody = document.getElementById('article-body-content');
    if(articleBody) {
        // [FIX UX]: Thuật toán đếm chữ thông minh (loại trừ code, svg, style)
        const clone = articleBody.cloneNode(true);
        clone.querySelectorAll('svg, style, script, .code-wrapper').forEach(el => el.remove());
        const words = (clone.innerText || '').trim().split(/\s+/).filter(w => w.length > 0).length;
        
        const rt = document.querySelector('.rt-val'); 
        if(rt) rt.textContent = Math.ceil(words / 225) || 1;
        
        let currentFontSize = parseFloat(localStorage.getItem('edevx_font_size')) || 1.05;
        document.documentElement.style.setProperty('--article-font-size', currentFontSize + 'rem');
        
        const updateFont = (val) => { currentFontSize = parseFloat((currentFontSize + val).toFixed(2)); document.documentElement.style.setProperty('--article-font-size', currentFontSize + 'rem'); localStorage.setItem('edevx_font_size', currentFontSize); };
        const fInc = document.getElementById('font-increase'); const fDec = document.getElementById('font-decrease');
        if(fInc) fInc.addEventListener('click', (e) => { e.preventDefault(); if(currentFontSize < 1.5) updateFont(0.1); });
        if(fDec) fDec.addEventListener('click', (e) => { e.preventDefault(); if(currentFontSize > 0.85) updateFont(-0.1); });
    }

    // --- 2. FLOATING BUTTONS (NÚT NỔI & MỤC LỤC MOBILE) ---
    const bttBtn = document.getElementById('back-to-top');
    const tocBtn = document.getElementById('open-toc-mobile');
    if (bttBtn || tocBtn) {
        const sentinel = document.createElement('div');
        sentinel.style.cssText = 'position:absolute; top:300px; width:100%; height:1px; z-index:-1; pointer-events:none;';
        document.body.appendChild(sentinel);

        const observer = new IntersectionObserver(([entry]) => {
            const isVisible = !entry.isIntersecting; 
            [bttBtn, tocBtn].forEach(btn => {
                if (btn) {
                    btn.classList.toggle('opacity-0', !isVisible);
                    btn.classList.toggle('translate-y-20', !isVisible);
                    btn.classList.toggle('pointer-events-none', !isVisible);
                }
            });
        });
        observer.observe(sentinel);
        if(bttBtn) bttBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // --- 3. LIVE SEARCH ---
    const searchInput = document.getElementById('search-input');
    if(searchInput) {
        let timeout;
        const loader = document.getElementById('search-loader');
        const dropdown = document.getElementById('search-dropdown');
        const resultsBox = document.getElementById('search-results');
        
        // [FIX BẢO MẬT]: Hàm chống XSS (Cross-Site Scripting)
        const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));

        searchInput.addEventListener('input', function() {
            clearTimeout(timeout); const query = this.value.trim();
            if(query.length === 0) { dropdown.classList.add('hidden'); return; }
            loader.style.display = 'block'; dropdown.classList.remove('hidden');
            timeout = setTimeout(() => {
                fetch(`/feeds/posts/summary?alt=json&q=${encodeURIComponent(query)}&max-results=5`).then(res => res.json()).then(data => {
                    loader.style.display = 'none'; resultsBox.innerHTML = '';
                    if(data.feed.entry) {
                        data.feed.entry.forEach(post => {
                            let link = post.link.find(l => l.rel === 'alternate')?.href || '#';
                            let thumb = post.media$thumbnail ? `<img src="${post.media$thumbnail.url}" class="w-10 h-10 object-cover rounded-md flex-shrink-0 border border-zinc-200 dark:border-zinc-700">` : `<div class="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-700"><i class="fas fa-file-alt text-zinc-400"></i></div>`;
                            
                            // [ĐÃ FIX]: Sử dụng escapeHTML() bảo vệ post.title.$t
                            resultsBox.innerHTML += `<a href="${link}" class="flex gap-3 items-center p-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">${thumb}<span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2">${escapeHTML(post.title.$t)}</span></a>`;
                        });
                        resultsBox.innerHTML += `<a href="/search?q=${encodeURIComponent(query)}" class="block p-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition">Xem tất cả kết quả &rarr;</a>`;
                    } else { resultsBox.innerHTML = `<div class="p-4 text-center text-sm text-zinc-500">Không tìm thấy bài viết nào.</div>`; }
                });
            }, 500);
        });
        document.addEventListener('click', (e) => { if(!searchInput.parentElement.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden'); });
    }

    const mSearchBtn = document.getElementById('mobile-search-btn');
    if(mSearchBtn) mSearchBtn.addEventListener('click', () => {
        const c = document.getElementById('search-container'); c.classList.toggle('hidden'); c.classList.toggle('absolute'); c.classList.toggle('w-full'); c.classList.toggle('left-0'); c.classList.toggle('px-6');
        if(!c.classList.contains('hidden')) searchInput.focus();
    });

    // --- 4. TOCBOT (BẢN FIX ĐÃ HOẠT ĐỘNG 100%) ---
    const tocContainer = document.querySelector('.js-toc');
    if (tocContainer && articleBody) {
        articleBody.querySelectorAll('h2, h3').forEach((h, i) => { if(!h.id) h.id = h.innerText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'toc-'+i; });
        tocbot.init({ tocSelector: '.js-toc', contentSelector: '#article-body-content', headingSelector: 'h2, h3', hasInnerContainers: false, headingsOffset: 120, scrollSmoothOffset: -100 });
        
        const tocWrap = document.getElementById('toc-container'); 
        const oBtn = document.getElementById('open-toc-mobile'); 
        const cBtn = document.getElementById('close-toc-mobile');
        
        if(tocWrap) {
            // FIX: Gỡ đúng 3 lớp khóa tàng hình
            const toggleToc = () => { 
                tocWrap.classList.toggle('translate-y-full'); 
                tocWrap.classList.toggle('opacity-0'); 
                tocWrap.classList.toggle('pointer-events-none'); 
            };
            if(oBtn) oBtn.addEventListener('click', toggleToc); 
            if(cBtn) cBtn.addEventListener('click', toggleToc);
            tocWrap.addEventListener('click', e => { if(e.target.tagName==='A' && window.innerWidth < 1024) toggleToc(); });
        }
    }

    // --- 5. LAZY LOAD (KaTeX & PrismJS) ---
    function loadLazyCSS(href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
    const loadScript = (src) => new Promise(resolve => { const s = document.createElement('script'); s.src = src; s.onload = resolve; document.body.appendChild(s); });

    if (document.querySelector('pre')) {
        loadLazyCSS('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css');
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js');
    }
    
    // [ĐÃ FIX]: Quét toàn bộ thẻ Body để phát hiện dấu $ ở cả Trang chủ lẫn Trang con
    if (document.body && (document.body.innerText.includes('$$') || document.body.innerText.includes('$'))) {
        loadLazyCSS('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css');
        (async () => {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/contrib/auto-render.min.js');
            
            // Xử lý xuống dòng cho công thức
            document.querySelectorAll('.prose').forEach(p => { p.innerHTML = p.innerHTML.replace(/\$\$([\s\S]*?)\$\$/g, (m,g)=>`$$${g.replace(/<br\s*\/?>/gi,'\n')}$$`).replace(/\$([\s\S]*?)\$/g, (m,g)=>`$${g.replace(/<br\s*\/?>/gi,' ')}$`); });
            
            // Render toàn bộ trang
            renderMathInElement(document.body, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false });
            
            if(tocContainer) setTimeout(() => tocbot.refresh(), 500);
        })();
    }

    // --- 6. EDTECH COMPONENTS (Global Event Delegation) ---
    function decodeHTML(html) { var t = document.createElement("textarea"); t.innerHTML = html; return t.value; }
    
    // Auto-Linkify
    if(articleBody) {
        function autoLinkify(node) {
            if(node.nodeType === 3) {
                const text = node.nodeValue; const urlRegex = /(https?:\/\/[^\s]+)/g;
                if(urlRegex.test(text)) {
                    const span = document.createElement('span');
                    span.innerHTML = text.replace(urlRegex, function(url) {
                        let cUrl = url.replace(/[.,;!?]$/, ''); let tail = url.substring(cUrl.length);
                        let isDrv = cUrl.includes('drive.google'); let isYt = cUrl.includes('youtu');
                        let cls = `inline-flex items-center gap-2 px-5 py-2.5 my-2 text-white font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all ${isDrv?'bg-blue-600 hover:bg-blue-700':(isYt?'bg-red-600 hover:bg-red-700':'bg-blue-600 hover:bg-blue-700 break-all')}`;
                        let icn = isDrv?'fas fa-cloud-download-alt':(isYt?'fab fa-youtube':'fas fa-bookmark text-yellow-300');
                        return `<a href="${cUrl}" target="_blank" class="${cls}"><i class="${icn} text-lg"></i> ${isDrv?'Mở File Google Drive':(isYt?'Xem Video YouTube':cUrl)}</a>${tail}`;
                    }); node.parentNode.replaceChild(span, node);
                }
            } else if(node.nodeType === 1 && !['A','PRE','CODE','BUTTON'].includes(node.nodeName)) { Array.from(node.childNodes).forEach(autoLinkify); }
        } autoLinkify(articleBody);
        
        articleBody.querySelectorAll('a').forEach(a => {
            if(!a.querySelector('img') && !a.closest('.quiz-container') && !a.closest('.flashcard-wrapper') && !a.closest('.code-wrapper') && !a.closest('.js-toc') && a.textContent.trim()) {
                a.removeAttribute('style'); a.target = "_blank"; a.className = "inline-flex items-center gap-2.5 px-5 py-2.5 my-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all text-base no-underline";
                if(!a.querySelector('.fa-book-reader')) a.innerHTML = `<i class="fas fa-book-reader text-yellow-300 text-lg"></i> <span>${a.textContent.trim()}</span> <i class="fas fa-external-link-alt text-xs opacity-70 ml-1"></i>`;
            }
        });
    }

    // Code Gemini Builder
    document.querySelectorAll('.prose pre').forEach(pre => {
        const cBlock = pre.querySelector('code'); if(!cBlock) return;
        let lName = "CODE"; const lClass = Array.from(cBlock.classList).find(c=>c.startsWith('language-'));
        if(lClass) { lName = lClass.replace('language-','').toUpperCase(); if(lName==='JS'||lName==='JAVASCRIPT') lName='JAVASCRIPT'; if(lName==='CPP') lName='C++'; if(lName==='PY') lName='PYTHON'; if(lName==='CS') lName='C#'; }
        const sCont = cBlock.textContent.replace(/"/g, '&quot;');
        const wrap = document.createElement('div'); wrap.className = 'code-wrapper';
        wrap.innerHTML = `<div class="code-header"><div class="text-sm font-bold text-zinc-200 tracking-wider">${lName}</div><div class="flex items-center gap-4 text-zinc-400"><button class="download-btn hover:text-white transition" data-code="${sCont}" data-ext="${lName}" title="Tải xuống"><i class="fa-solid fa-circle-arrow-down text-lg"></i></button><button class="copy-btn hover:text-white transition" data-clipboard-text="${sCont}" title="Sao chép"><i class="fa-regular fa-copy text-lg"></i></button></div></div>`;
        pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(pre);
    });

    document.querySelectorAll('.prose img').forEach(img => { img.classList.add('zoomable-img'); const p = img.closest('a'); if(p) p.addEventListener('click', e=>e.preventDefault()); });
    mediumZoom('.zoomable-img', { background: 'rgba(9, 9, 11, 0.95)', margin: 24 });

    // GỘP MỌI SỰ KIỆN CLICK
    document.addEventListener('click', async (e) => {
        const cpBtn = e.target.closest('.copy-btn');
        if(cpBtn) { try { await navigator.clipboard.writeText(decodeHTML(cpBtn.getAttribute('data-clipboard-text'))); const icn = cpBtn.querySelector('i'); icn.className = 'fa-solid fa-check text-green-400 text-lg'; setTimeout(() => icn.className='fa-regular fa-copy text-lg', 2000); } catch(err){} return; }
        
        const dlBtn = e.target.closest('.download-btn');
        if(dlBtn) { let ext = dlBtn.getAttribute('data-ext').toLowerCase(); if(ext==='c++')ext='cpp'; if(ext==='javascript')ext='js'; if(ext==='python')ext='py'; if(ext==='code')ext='txt'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([decodeHTML(dlBtn.getAttribute('data-code'))], {type:'text/plain;charset=utf-8'})); a.download = 'snippet.'+ext; a.click(); URL.revokeObjectURL(a.href); return; }
        
        const fc = e.target.closest('.flashcard-wrapper'); if(fc && !e.target.closest('.speak-btn')) { fc.classList.toggle('is-flipped'); return; }
        
        const qOpt = e.target.closest('.quiz-option');
        if(qOpt) {
            const qz = qOpt.closest('.quiz-container'); if(qz.classList.contains('answered')) return;
            qz.classList.add('answered');
            if(qOpt.getAttribute('data-correct') === 'true') { qOpt.classList.add('correct'); qOpt.innerHTML+=' <i class="fas fa-check-circle absolute right-4"></i>'; }
            else { qOpt.classList.add('incorrect'); qOpt.innerHTML+=' <i class="fas fa-times-circle absolute right-4"></i>'; const corr = qz.querySelector('[data-correct="true"]'); if(corr) corr.classList.add('correct'); }
            return;
        }
    });

    // --- 7. DICTIONARY V37 ---
    (function(){
        const style = document.createElement('style'); style.innerHTML = `#google-popover-content::-webkit-scrollbar { width: 5px; } #google-popover-content::-webkit-scrollbar-track { background: transparent; } #google-popover-content::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; } .dark #google-popover-content::-webkit-scrollbar-thumb { background-color: #52525b; } .trans-tab.active { background-color: #0000ff; color: white; border-color: #0000ff; } .dark .trans-tab.active { background-color: #3b82f6; border-color: #3b82f6; color: white; }`; document.head.appendChild(style);
        let globalVoices = []; function initVoices() { if('speechSynthesis' in window) globalVoices = window.speechSynthesis.getVoices(); }
        if('speechSynthesis' in window) { initVoices(); window.speechSynthesis.onvoiceschanged = initVoices; }

        const popover = document.createElement('div'); popover.id = 'google-popover'; popover.className = 'fixed hidden z-[9999] bg-[#f9fafb] dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-5 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-zinc-300 dark:border-zinc-700 transition-all duration-200 pointer-events-auto flex flex-col max-h-[85vh]'; document.body.appendChild(popover);
        
        function isVietnamese(str) { return /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(str); }
        window.currentOxfordAudio = null;
        window.playPremiumAudio = function(text, lang = 'us') {
            if(window.currentOxfordAudio) { window.currentOxfordAudio.pause(); window.currentOxfordAudio=null; }
            if('speechSynthesis' in window) window.speechSynthesis.cancel();
            const cleanWord = text.toLowerCase().trim().replace(/[^a-z-]/g, '');
            if(text.split(' ').length < 3) {
                window.currentOxfordAudio = new Audio(`https://ssl.gstatic.com/dictionary/static/sounds/oxford/${cleanWord}--_${lang}_1.mp3`);
                window.currentOxfordAudio.play().catch(() => playAI(text, lang));
            } else playAI(text, lang);
        };
        function playAI(text, lang) {
            if (!('speechSynthesis' in window)) return;
            const utt = new SpeechSynthesisUtterance(text.replace(/['"“”‘’]/g, '').trim()); utt.lang = lang==='us'?'en-US':'en-GB'; utt.rate = 0.88;
            if(globalVoices.length===0) initVoices();
            if(globalVoices.length > 0) {
                let enV = globalVoices.filter(v => v.lang.replace('_','-').includes(lang==='us'?'US':'GB') || v.lang.startsWith('en'));
                utt.voice = enV.find(v=>(v.name.includes('Guy')||v.name.includes('Ryan'))&&v.name.includes('Natural')) || enV.find(v=>v.name.includes('Natural')||v.name.includes('Online')) || enV.find(v=>v.name.includes('Google')) || enV[0];
            } window.speechSynthesis.speak(utt);
        }

        let cacheTrans = { google: '', bing: '' };
        let dictAbortController = null; // Thêm bộ điều khiển hủy API

        async function fetchBing(text, isVi) { try { const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${isVi?'vi':'en'}|${isVi?'en':'vi'}`); const data = await res.json(); return data?.responseData?.translatedText || "Lỗi máy chủ Bing"; } catch(e){ return "Lỗi kết nối Bing"; } }

        function updatePos(rect, isLong) {
            popover.style.width = 'calc(100vw - 32px)'; popover.style.maxWidth = isLong ? '480px' : '520px';
            let left = Math.max(15, Math.min(window.innerWidth - popover.getBoundingClientRect().width - 15, rect.left + (rect.width/2) - (popover.getBoundingClientRect().width/2)));
            let top = rect.top - popover.getBoundingClientRect().height - 15; if(top < 15) top = rect.bottom + 15; if(top + popover.getBoundingClientRect().height > window.innerHeight - 15) top = window.innerHeight - popover.getBoundingClientRect().height - 15;
            popover.style.left = `${left}px`; popover.style.top = `${top}px`;
        }

        document.addEventListener('mouseup', async (e) => {
            const pageContent = (document.title + ' ' + window.location.href + ' ' + document.body.innerText.slice(0, 2000)).toLowerCase();
            const pageHTML = document.body.innerHTML.toLowerCase();
            const isEnglishArticle = pageContent.includes('english') || pageContent.includes('tiếng anh') || pageContent.includes('tieng anh') || pageHTML.includes('/search/label/english') || pageHTML.includes('/search/label/tieng-anh') || pageHTML.includes('/search/label/anh-van');

            if (!isEnglishArticle) return;
            const sel = window.getSelection(); const text = sel.toString().trim();
            if(!text || text.length < 2 || popover.contains(e.target)) { 
                if(!popover.contains(e.target)) { 
                    popover.classList.add('hidden'); 
                    if(window.currentOxfordAudio)window.currentOxfordAudio.pause(); 
                    window.speechSynthesis.cancel(); 
                    if(dictAbortController) dictAbortController.abort(); // Hủy API khi click ra ngoài
                } 
                return; 
            }
            const rect = sel.getRangeAt(0).getBoundingClientRect(); const isLong = text.split(/\s+/).length > 3; const isVi = isVietnamese(text);
            popover.innerHTML = `<div class="flex items-center justify-center gap-2.5 text-zinc-500 p-3 text-[14px] font-medium animate-pulse"><i class="fas fa-circle-notch fa-spin text-blue-600"></i> Đang dịch...</div>`;
            popover.classList.remove('hidden'); updatePos(rect, isLong);

            // FIX RACE CONDITION
            if (dictAbortController) dictAbortController.abort();
            dictAbortController = new AbortController();
            const signal = dictAbortController.signal;

            try {
                const [gtRes, jsonDictRes, enDictRes] = await Promise.all([
                    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${isVi?'vi':'en'}&tl=${isVi?'en':'vi'}&dt=t&dt=bd&q=${encodeURIComponent(text)}`, { signal }),
                    (!isLong && !isVi) ? fetch(`https://dict.minhqnd.com/api/v1/lookup?word=${encodeURIComponent(text.toLowerCase())}`, { signal }).then(r=>r.ok?r.json():null).catch(()=>null) : null,
                    (!isLong && !isVi) ? fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.toLowerCase())}`, { signal }).then(r=>r.ok?r.json():null).catch(()=>null) : null
                ]);
                const gtData = await gtRes.json(); cacheTrans.google = gtData[0] ? gtData[0].map(i=>i[0]?i[0]:'').join('') : ''; cacheTrans.bing = '';
                let ipaText = ''; let htmlVi = ''; let htmlEn = '';

                const getBadge = (p) => { p=p.toLowerCase(); if(p.includes('danh')||p.includes('noun')) return 'bg-[#0033cc] dark:bg-blue-700'; if(p.includes('động')||p.includes('verb')) return 'bg-[#006600] dark:bg-emerald-700'; if(p.includes('tính')||p.includes('adj')) return 'bg-[#cc0000] dark:bg-red-700'; return 'bg-purple-700 dark:bg-purple-800'; };
                const tPOS = (p) => ({'noun':'Danh từ','verb':'Động từ','adjective':'Tính từ','adverb':'Trạng từ','pronoun':'Đại từ','preposition':'Giới từ','conjunction':'Liên từ'})[p.toLowerCase()] || p;

                if(!isLong) {
                    if(!isVi && jsonDictRes?.exists) {
                        if(jsonDictRes.results[0].pronunciations?.length > 0) ipaText = jsonDictRes.results[0].pronunciations[0].ipa;
                        let grp = {}; jsonDictRes.results[0].meanings.forEach(m => { let p = m.pos||'Khác'; if(!grp[p])grp[p]=[]; grp[p].push(m); });
                        for(const pos in grp) {
                            htmlVi += `<div class="mt-4 pt-1"><span class="${getBadge(pos)} text-white px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider shadow-sm">${pos}</span>`;
                            grp[pos].slice(0,4).forEach((m, i) => {
                                htmlVi += `<div class="mt-2.5"><div class="text-[14.5px] text-zinc-900 dark:text-zinc-100 leading-snug flex gap-1.5 pl-1"><span class="font-bold text-zinc-400 shrink-0">${i+1}</span><span>${m.definition}</span></div>`;
                                if(m.example) { let cleanEx = m.example.replace(/~/g, text.toLowerCase()); htmlVi += `<div class="mt-1.5 pl-[16px] flex items-start gap-1.5 group cursor-pointer" onclick="playPremiumAudio('${cleanEx.split(/[-:=]/)[0].replace(/'/g,"\\'").trim()}')" title="Nghe"><i class="fas fa-volume-up text-[#006600]/70 dark:text-emerald-500/70 text-[11px] mt-1 group-hover:text-[#006600]"></i><div class="text-[#006600] dark:text-emerald-400 italic text-[14px] leading-relaxed group-hover:underline">${cleanEx}</div></div>`; }
                                htmlVi += `</div>`;
                            }); htmlVi += `</div>`;
                        }
                    } else if(!isVi && gtData[1]) {
                        gtData[1].sort((a,b)=>({'noun':1,'verb':2,'adjective':3,'adverb':4}[a[0]]||99)-({'noun':1,'verb':2,'adjective':3,'adverb':4}[b[0]]||99)).forEach(g => {
                            htmlVi += `<div class="mt-4 pt-1"><span class="${getBadge(tPOS(g[0]))} text-white px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase">${tPOS(g[0])}</span>`;
                            g[1].slice(0,5).forEach((w,i) => { htmlVi += `<div class="mt-2.5"><div class="text-[14px] text-zinc-900 dark:text-zinc-100 flex gap-1.5 pl-1"><span class="font-bold text-zinc-400">${i+1}</span><span>${w}</span></div></div>`; });
                            htmlVi += `</div>`;
                        });
                    } else { htmlVi = `<div class="mt-2.5 text-[14.5px] text-zinc-900 dark:text-zinc-100 pl-1"><span class="font-bold text-zinc-400 mr-1.5">—</span>${cacheTrans.google.split(',')[0]}</div>`; }

                    if(enDictRes?.length > 0) {
                        if(!ipaText) { for(let e of enDictRes) { let ipa=e.phonetic||e.phonetics?.find(p=>p.text)?.text; if(ipa){ipaText=ipa; break;} } }
                        let allM = []; enDictRes.forEach(e => { if(e.meanings) allM=allM.concat(e.meanings); });
                        allM.sort((a,b)=>({'noun':1,'verb':2,'adjective':3,'adverb':4}[a.partOfSpeech]||99)-({'noun':1,'verb':2,'adjective':3,'adverb':4}[b.partOfSpeech]||99)).slice(0,4).forEach(m => {
                            htmlEn += `<div class="mt-4 pt-1"><span class="${getBadge(m.partOfSpeech)} text-white px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase shadow-sm">${m.partOfSpeech}</span>`;
                            m.definitions.slice(0,3).forEach((d, i) => {
                                htmlEn += `<div class="mt-2.5"><div class="text-[14.5px] text-zinc-900 dark:text-zinc-100 flex gap-1.5"><span class="font-bold text-zinc-400">${i+1}</span><span>${d.definition}</span></div>`;
                                if(d.example) htmlEn += `<div class="mt-1.5 pl-[16px] flex items-start gap-1.5 group cursor-pointer" onclick="playPremiumAudio('${d.example.replace(/'/g,"\\'").trim()}')"><i class="fas fa-volume-up text-[#0033cc]/60 dark:text-blue-400/60 text-[11px] mt-1 group-hover:text-[#0033cc]"></i><div class="text-[#0033cc] dark:text-blue-400 italic text-[14px] group-hover:underline">${d.example}</div></div>`;
                                htmlEn += `</div>`;
                            }); htmlEn += `</div>`;
                        });
                    }

                    popover.innerHTML = `<div class="mb-3 flex items-start justify-between gap-3 shrink-0 border-b border-zinc-200 dark:border-zinc-700 pb-3"><div class="flex flex-col"><div class="text-[26px] font-black text-[#cc0000] dark:text-red-500 uppercase leading-none mb-1.5">${text}</div>${ipaText?`<div class="text-[14px] font-mono font-bold text-zinc-600 dark:text-zinc-400">${ipaText}</div>`:''}</div><div class="flex items-center gap-1.5 shrink-0"><button class="pop-speak-btn p-2 rounded-lg bg-zinc-200/50 dark:bg-zinc-800 text-red-600 transition-colors" data-lang="us"><i class="fas fa-volume-up text-lg"></i><span class="text-[10px] font-bold ml-1 text-zinc-600">US</span></button><button class="pop-speak-btn p-2 rounded-lg bg-zinc-200/50 dark:bg-zinc-800 text-blue-700 transition-colors" data-lang="gb"><i class="fas fa-volume-up text-lg"></i><span class="text-[10px] font-bold ml-1 text-zinc-600">UK</span></button></div></div><div id="google-popover-content" class="overflow-y-auto pr-3 flex-grow pb-2"><div class="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm mb-4"><div class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-1">▼ En - Vi</div>${htmlVi}</div>${htmlEn ? `<div class="bg-[#f0f4f8]/80 dark:bg-zinc-800/50 p-4 rounded-xl border border-blue-100/80 dark:border-zinc-700 shadow-sm"><div class="text-[11px] font-bold text-[#0033cc] dark:text-blue-400 uppercase border-b border-blue-200 dark:border-zinc-700 pb-2 mb-1">▼ En - En</div>${htmlEn}</div>` : ''}</div><div class="mt-4 flex items-center gap-2.5 shrink-0 pt-1"><a href="https://www.ldoceonline.com/dictionary/${encodeURIComponent(text.toLowerCase().replace(/\s+/g,'-'))}" target="_blank" class="flex-1 flex justify-center items-center py-2.5 bg-red-50 dark:bg-red-900/20 text-[#cc0000] dark:text-red-400 rounded-xl text-[11px] font-black uppercase"><i class="fas fa-external-link-alt ml-0.5"></i> Longman</a><a href="https://dict.laban.vn/find?type=1&query=${encodeURIComponent(text.toLowerCase())}" target="_blank" class="flex-1 flex justify-center items-center py-2.5 bg-blue-50 dark:bg-blue-900/20 text-[#0033cc] dark:text-blue-400 rounded-xl text-[11px] font-black uppercase"><i class="fas fa-external-link-alt ml-0.5"></i> Laban</a></div>`;
                } else {
                    popover.innerHTML = `<div class="mb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2.5"><div class="flex items-center bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-lg"><button id="tab-google" class="trans-tab active px-3 py-1.5 rounded-md text-[11px] font-black uppercase">Google</button><button id="tab-bing" class="trans-tab px-3 py-1.5 rounded-md text-[11px] font-black uppercase ml-1">Bing AI</button></div><button class="pop-speak-btn bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg flex items-center text-zinc-800 dark:text-zinc-200" data-lang="us"><i class="fas fa-volume-up mr-1.5 text-[#cc0000] dark:text-red-500"></i><span class="text-[11px] font-bold">Đọc câu</span></button></div><div id="google-popover-content" class="max-h-[250px] overflow-y-auto pr-2"><div class="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl italic text-zinc-700 dark:text-zinc-300 mb-3 text-[14.5px]">"${text}"</div><div id="trans-result" class="font-medium text-black dark:text-zinc-100 text-[15px] whitespace-pre-wrap">${cacheTrans.google}</div></div>`;
                    document.getElementById('tab-google').onclick=()=>{ document.getElementById('tab-bing').classList.remove('active','bg-[#0000ff]','text-white'); document.getElementById('tab-google').classList.add('active'); document.getElementById('trans-result').innerHTML=cacheTrans.google; };
                    document.getElementById('tab-bing').onclick=async()=>{ document.getElementById('tab-google').classList.remove('active'); document.getElementById('tab-bing').classList.add('active'); if(!cacheTrans.bing){ document.getElementById('trans-result').innerHTML=`<i class="fas fa-circle-notch fa-spin text-[#0000ff]"></i> Đang lấy dữ liệu...`; cacheTrans.bing = await fetchBing(text, isVi); } document.getElementById('trans-result').innerHTML=cacheTrans.bing; };
                }

                setTimeout(() => updatePos(rect, isLong), 10);
                popover.querySelectorAll('.pop-speak-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); playPremiumAudio(isVi?cacheTrans.google:text, btn.getAttribute('data-lang')); });
            } catch(e) { 
                if (e.name === 'AbortError') return; 
                popover.classList.add('hidden'); console.error(e); 
            }
        });
        document.addEventListener('mousedown', (e) => { if(!popover.contains(e.target)) { popover.classList.add('hidden'); if(window.currentOxfordAudio)window.currentOxfordAudio.pause(); window.speechSynthesis.cancel(); } });
        
        // ĐỌC FLASHCARD 
        document.addEventListener('click', e => {
            const btn = e.target.closest('.speak-btn'); if(!btn) return;
            e.stopPropagation(); const txt = btn.getAttribute('data-text'); let lg = btn.getAttribute('data-lang')||'us';
            if(lg.toLowerCase().includes('gb')||lg.toLowerCase().includes('uk')) lg='gb'; else lg='us';
            if(txt) { const icn = btn.querySelector('i'); const oldCls = icn?icn.className:''; if(icn) icn.className='fas fa-volume-up text-blue-500 animate-pulse'; playPremiumAudio(txt, lg); setTimeout(()=> { if(icn)icn.className=oldCls; }, 1500); }
        });
    })();

    // --- 8. PHỤC HỒI ĐỘNG CƠ XỬ LÝ SLIDE MODE BẢN GỐC ---
    const slideElem = document.querySelector('.slide-container');
    if (slideElem) {
        document.body.classList.add('has-slide');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        
        const articleBodyForSlide = document.getElementById('article-body-content');
        if (articleBodyForSlide) {
            articleBodyForSlide.classList.remove('prose', 'prose-zinc', 'dark:prose-invert');
            articleBodyForSlide.querySelectorAll('br').forEach(br => br.remove());
            articleBodyForSlide.innerHTML = articleBodyForSlide.innerHTML.replace(/&nbsp;/g, ' ');
        }
    }

    // --- 8. FOCUS WORKSPACE DOCK (POMODORO 3 MODE) ---
    (function initPomodoro() {
        const panel = document.getElementById('pomo-panel');
        if(!panel) return;

        const toggleBtn = document.getElementById('pomo-toggle');
        const timeDisplay = document.getElementById('pomo-time');
        const startBtn = document.getElementById('pomo-start');
        const resetBtn = document.getElementById('pomo-reset');
        const playIcon = document.getElementById('pomo-play-icon');
        
        // Nhóm các nút chế độ theo thứ tự: 15p - 25p - 5p
        const modeBtns = [
            document.getElementById('mode-warmup'),
            document.getElementById('mode-focus'),
            document.getElementById('mode-break')
        ];

        // Mặc định khởi động là 15 phút (Màu tím)
        let currentMinutes = 15;
        let currentColor = 'purple'; 
        let timeLeft = 15 * 60; 
        let timerId = null;
        let isRunning = false;

        // Bật/Tắt Bảng điều khiển
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('hidden');
            if (!isRunning) {
                toggleBtn.classList.toggle('opacity-30');
                toggleBtn.classList.toggle('opacity-100');
                toggleBtn.classList.toggle(`text-${currentColor}-600`);
                toggleBtn.classList.toggle('text-zinc-400');
            }
        });

        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const updateDisplay = () => {
            timeDisplay.textContent = formatTime(timeLeft);
            document.title = isRunning ? `(${formatTime(timeLeft)}) EDEVX Focus` : document.title.split(') ')[1] || document.title;
        };

        // Động cơ đổi màu & Đổi chế độ
        const setMode = (btn) => {
            currentMinutes = parseInt(btn.getAttribute('data-time'));
            currentColor = btn.getAttribute('data-color');
            timeLeft = currentMinutes * 60;
            updateDisplay();
            pauseTimer();
            
            // Xóa màu active của tất cả các nút
            modeBtns.forEach(b => {
                b.className = `px-2.5 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-${b.getAttribute('data-color')}-500 transition-all`;
            });

            // Bật màu active cho nút được chọn
            btn.className = `px-2.5 py-1 text-xs font-bold rounded-md bg-white dark:bg-zinc-700 text-${currentColor}-500 shadow-sm transition-all`;
            
            // Đổi màu số và màu nút Start
            timeDisplay.className = `text-5xl font-black text-center text-${currentColor}-600 dark:text-${currentColor}-500 font-mono tracking-widest mb-6 transition-colors duration-300`;
            startBtn.className = `w-12 h-12 bg-${currentColor}-600 hover:bg-${currentColor}-700 text-white rounded-full flex items-center justify-center text-lg shadow-lg hover:scale-105 transition-all`;
        };

        // Gắn sự kiện click cho 3 nút
        modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn)));

        const startTimer = () => {
            if (isRunning) return;
            isRunning = true;
            playIcon.className = 'fas fa-pause';
            
            // Khóa sáng nút nổi
            toggleBtn.classList.remove('opacity-30', 'text-zinc-400');
            toggleBtn.classList.add('opacity-100', `text-${currentColor}-600`);
            timeDisplay.classList.add('animate-pulse');

            timerId = setInterval(() => {
                timeLeft--;
                updateDisplay();
                if (timeLeft <= 0) {
                    pauseTimer();
                    
                    // Thông báo thông minh theo số phút
                    if (currentMinutes === 15) {
                        alert("Khởi động xuất sắc! Thưởng cho con 5 phút nghỉ ngơi nhé!");
                        setMode(modeBtns[2]); // Chuyển sang 5p nghỉ
                    } else if (currentMinutes === 25) {
                        alert("Tập trung đỉnh cao! Đến lúc xả hơi 5 phút rồi!");
                        setMode(modeBtns[2]); // Chuyển sang 5p nghỉ
                    } else {
                        alert("Hết giờ giải lao! Quay lại bàn học thôi con!");
                        // Hết 5p nghỉ thì tự quay về mốc 15p cho an toàn
                        setMode(modeBtns[0]); 
                    }
                }
            }, 1000);
        };

        const pauseTimer = () => {
            isRunning = false;
            playIcon.className = 'fas fa-play';
            clearInterval(timerId);
            timeDisplay.classList.remove('animate-pulse');
            
            if (panel.classList.contains('hidden')) {
                toggleBtn.classList.add('opacity-30', 'text-zinc-400');
                toggleBtn.classList.remove('opacity-100', 'text-blue-600', 'text-purple-600', 'text-emerald-600');
            }
        };

        startBtn.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
        resetBtn.addEventListener('click', () => setMode(modeBtns.find(b => parseInt(b.getAttribute('data-time')) === currentMinutes)));
    })();


});