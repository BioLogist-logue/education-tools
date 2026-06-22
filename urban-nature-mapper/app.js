// 🚪 [웹앱 보안 문지기] 학생들만 아는 비밀번호가 틀리면 화면을 아예 파괴합니다.
const accessPassword = prompt("🔒 우리 과학 수업 전용 비밀번호 4자리를 입력하세요:");
if (accessPassword !== "7890") { // 👈 주인님이 원하시는 4자리 암호 설정
    alert("❌ 권한이 없습니다. 외부인은 접속할 수 없습니다.");
    document.body.innerHTML = "<div style='text-align:center; margin-top:20%; font-size:24px; font-weight:bold; color:red;'>🔒 인가되지 않은 사용자입니다. 접근이 차단되었습니다.</div>";
    throw new Error("Access Denied"); // 스크립트 강제 중단
}

// ==========================================
// 🛡️ [모바일 최적화 UI & 타일 찢어짐 방지 쉴드]
// ==========================================
const mobileUIStyle = document.createElement('style');
mobileUIStyle.innerHTML = `
    /* 카카오맵 타일 찢어짐 방지 */
    #map, #map * { box-sizing: content-box !important; }
    #map img { max-width: none !important; max-height: none !important; }
    
    /* 🌟 정보창(팝업) 반응형 디자인: 데스크탑에서는 크게! */
    .info-container { padding: 15px; width: 280px; font-family: sans-serif; line-height: 1.5; }
    .info-title { font-size: 18px; font-weight: bold; color: #2e7d32; margin-bottom: 8px; border-bottom: 2px solid #2e7d32; padding-bottom: 5px; }
    .info-meta { font-size: 14px; color: #555; margin-bottom: 10px; }
    .info-img { width: 100%; max-height: 200px; object-fit: cover; margin: 10px 0; border-radius: 8px; border: 1px solid #ddd; display: block; }
    .info-desc { font-size: 15px; color: #222; margin-bottom: 15px; background: #f5f5f5; padding: 10px; border-radius: 6px; }
    .info-btn { flex: 1; cursor: pointer; padding: 10px; font-size: 14px; font-weight: bold; color: white; border: none; border-radius: 5px; }
    
    /* 📱 모바일 환경 (화면 폭 768px 이하) 최적화 */
    @media (max-width: 768px) {
        /* 정보창 크기 콤팩트하게 줄임 */
        .info-container { padding: 10px; width: 200px; }
        .info-title { font-size: 14px; margin-bottom: 5px; padding-bottom: 3px; }
        .info-meta { font-size: 12px; margin-bottom: 6px; }
        .info-img { max-height: 120px; margin: 6px 0; }
        .info-desc { font-size: 12px; padding: 8px; margin-bottom: 10px; }
        .info-btn { padding: 6px; font-size: 12px; }
        
        /* 폼 영역을 지도를 가리지 않는 '오버레이 팝업'으로 변신! */
        #sidebar {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 85vw !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            z-index: 9999 !important;
            background: white !important;
            border-radius: 12px !important;
            box-shadow: 0 5px 25px rgba(0,0,0,0.4) !important;
            display: none; /* 기본으로 숨겨서 지도를 꽉 채움 */
            padding: 20px !important;
        }
        /* 팝업 떴을 때 뒤에 깔리는 어두운 배경 */
        #mobile-overlay-bg {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.5); z-index: 9998; display: none;
        }
        /* 모바일 전용 작고 예쁜 둥근 버튼 */
        #mobile-toggle-btn {
            position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%);
            z-index: 9997; background-color: #2e7d32; color: white; border: none; border-radius: 30px;
            padding: 10px 20px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;
        }
    }
    
    /* 💻 컴퓨터 환경 (769px 이상) 에서는 원래대로 폼 노출, 모바일 버튼 숨김 */
    @media (min-width: 769px) {
        #sidebar { display: block !important; position: static !important; transform: none !important; width: auto !important; box-shadow: none !important; }
        #mobile-toggle-btn { display: none !important; }
        #mobile-overlay-bg { display: none !important; }
    }
`;
document.head.appendChild(mobileUIStyle);

// ==========================================
// 📱 모바일 팝업 폼 컨트롤러
// ==========================================
const toggleBtn = document.createElement('button');
toggleBtn.id = 'mobile-toggle-btn';
toggleBtn.innerHTML = '🌱 생물 등록하기';
document.body.appendChild(toggleBtn);

const overlayBg = document.createElement('div');
overlayBg.id = 'mobile-overlay-bg';
document.body.appendChild(overlayBg);

let isSidebarOpen = false;
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
        sidebar.style.setProperty('display', 'block', 'important');
        overlayBg.style.display = 'block';
        toggleBtn.innerHTML = '❌ 닫기';
        toggleBtn.style.backgroundColor = '#d32f2f';
    } else {
        sidebar.style.setProperty('display', 'none', 'important');
        overlayBg.style.display = 'none';
        toggleBtn.innerHTML = '🌱 생물 등록하기';
        toggleBtn.style.backgroundColor = '#2e7d32';
    }
    // 레이아웃 변경 시 카카오맵 강제 리프레시!
    setTimeout(() => { if (typeof map !== 'undefined') map.relayout(); }, 300);
}

toggleBtn.onclick = toggleSidebar;
overlayBg.onclick = toggleSidebar; // 어두운 배경 누르면 폼 닫힘


// ==========================================
// 1. 파이어베이스 세팅
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCQn32Fpt_Wxl0K1mw_SgKIZr1tERqte_I",
  authDomain: "urban-nature-mapper.firebaseapp.com",
  projectId: "urban-nature-mapper",
  storageBucket: "urban-nature-mapper.firebasestorage.app",
  messagingSenderId: "586767094407",
  appId: "1:586767094407:web:3650c6b4302ddcc52f1e22",
  measurementId: "G-GJXKEMTHD7"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let allMarkersList = [];
let currentFilter = "all"; 
let isInitialLoad = true; 

// SVG 마커 데이터 (절대 깨지지 않음)
const svgPins = {
    "생산자": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%232e7d32%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E",
    "소비자": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%23ffeb3b%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E",
    "분해자": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%23d32f2f%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E",
    "랜드마크": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%231565c0%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E"
};

function compressAndToBase64(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// 2. 카카오 지도 안착
// ==========================================
const mapContainer = document.getElementById('map');
const mapOption = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 3 };
const map = new kakao.maps.Map(mapContainer, mapOption);

window.addEventListener('resize', () => map.relayout());

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        if (allMarkersList.length === 0) {
            map.setCenter(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
        }
    });
}

// 3. 지도 클릭 시 신규 핀 위치 배정
let currentMarker = null;
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    const latlng = mouseEvent.latLng; 
    if (currentMarker === null) {
        currentMarker = new kakao.maps.Marker({ position: latlng, map: map });
    } else {
        currentMarker.setPosition(latlng);
    }
    document.getElementById('lat').value = latlng.getLat();
    document.getElementById('lng').value = latlng.getLng();
    document.getElementById('display-lat').innerText = latlng.getLat().toFixed(6);
    document.getElementById('display-lng').innerText = latlng.getLng().toFixed(6);
    
    // 모바일 환경에서 핀을 꽂으면 폼 열기 유도
    if (window.innerWidth <= 768 && !isSidebarOpen) {
        toggleSidebar();
    }
});

// 4. 데이터 저장 및 수정(Submit)
const form = document.getElementById('observation-form');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const photoUploadInput = document.getElementById('photo-upload');

form.addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const editDocId = document.getElementById('edit-doc-id').value;
    
    if (!lat || !lng) { await bioAlert("❌ 지도에서 발견 위치를 먼저 클릭해 주세요!"); return; }
    
    const studentInfo = document.getElementById('student-info').value;
    const creatureCategory = document.getElementById('creature-category').value;
    const creatureName = document.getElementById('creature-name').value;
    const discoveryLocation = document.getElementById('discovery-location').value;
    const observationDetails = document.getElementById('observation-details').value;
    const password = document.getElementById('post-password').value;
    const photoFile = photoUploadInput.files[0];
    
    submitBtn.disabled = true;
    submitBtn.innerText = "파이어베이스 동기화 중... ⏳";
    
    try {
        let finalImageUrl = "";
        if (photoFile) finalImageUrl = await compressAndToBase64(photoFile, 800, 0.75);

        if (editDocId) {
            const docRef = db.collection("urban_nature").doc(editDocId);
            const docSnap = await docRef.get();
            if (docSnap.data().password !== password) {
                await bioAlert("❌ 비밀번호가 틀렸습니다! 본인이 등록한 글만 수정할 수 있습니다.");
                submitBtn.disabled = false; submitBtn.innerText = "수정 완료하기 ✏️"; return;
            }
            let updateData = { studentInfo, category: creatureCategory, creatureName, discoveryLocation, observationDetails, latitude: parseFloat(lat), longitude: parseFloat(lng) };
            if (finalImageUrl) updateData.imageUrl = finalImageUrl;
            await docRef.update(updateData);
            await bioAlert("✏️ 성공적으로 정보가 수정되었습니다!");
            resetFormState();
        } else {
            if (!photoFile) {
                await bioAlert("❌ 생물 사진을 등록해 주세요!");
                submitBtn.disabled = false; submitBtn.innerText = "생태 지도에 등록하기 🚀"; return;
            }
            await db.collection("urban_nature").add({
                studentInfo, category: creatureCategory, creatureName, discoveryLocation, observationDetails, imageUrl: finalImageUrl, password, latitude: parseFloat(lat), longitude: parseFloat(lng), timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            await bioAlert("🎉 생태 지도 등록 완료!");
            resetFormState();
        }
    } catch (error) {
        console.error(error); alert("❌ 동기화 실패. 네트워크 상태를 확인하세요.");
    } finally { submitBtn.disabled = false; }
});

function resetFormState() {
    form.reset();
    document.getElementById('edit-doc-id').value = "";
    if (currentMarker) currentMarker.setMap(null); 
    currentMarker = null;
    document.getElementById('display-lat').innerText = "지도에서 위치를 클릭하세요";
    document.getElementById('display-lng').innerText = "지도에서 위치를 클릭하세요";
    photoUploadInput.required = true;
    submitBtn.style.backgroundColor = "#2e7d32";
    submitBtn.innerText = "생태 지도에 등록하기 🚀";
    cancelEditBtn.style.display = "none";
    
    // 등록이 끝나면 모바일에서는 지도를 시원하게 볼 수 있게 폼을 자동으로 닫습니다!
    if (window.innerWidth <= 768 && isSidebarOpen) toggleSidebar();
}

cancelEditBtn.addEventListener('click', resetFormState);

// 5. 리얼타임 데이터 동기화
db.collection("urban_nature").onSnapshot((snapshot) => {
    const bounds = new kakao.maps.LatLngBounds();
    let hasValidMarkers = false;

    snapshot.docChanges().forEach((change) => {
        const id = change.doc.id;
        const data = change.doc.data();
        if (change.type === "added") { createEcoMarker(id, data); } 
        else if (change.type === "modified") { removeMarkerFromMap(id); createEcoMarker(id, data); } 
        else if (change.type === "removed") { removeMarkerFromMap(id); }
    });

    if (isInitialLoad && allMarkersList.length > 0) {
        allMarkersList.forEach(item => {
            if (item.markerInstance) { bounds.extend(item.markerInstance.getPosition()); hasValidMarkers = true; }
        });
        if (hasValidMarkers) { map.setBounds(bounds); map.relayout(); }
        isInitialLoad = false; 
    }
});

function removeMarkerFromMap(id) {
    const idx = allMarkersList.findIndex(item => item.id === id);
    if (idx !== -1) {
        allMarkersList[idx].markerInstance.setMap(null); 
        allMarkersList[idx].windowInstance.close();
        allMarkersList.splice(idx, 1);
    }
}

// 6. 🌟 반응형 클래스가 적용된 마커 빌더
function createEcoMarker(id, data) {
    if (!data.latitude || !data.longitude) return;

    const pos = new kakao.maps.LatLng(data.latitude, data.longitude);
    const svgDataUri = svgPins[data.category] || svgPins["랜드마크"];
    const markerImage = new kakao.maps.MarkerImage(svgDataUri, new kakao.maps.Size(30, 42)); 

    const marker = new kakao.maps.Marker({
        position: pos,
        image: markerImage,
        map: currentFilter === "all" || currentFilter === data.category ? map : null
    });

    const imageHtml = data.imageUrl ? `<img src="${data.imageUrl}" class="info-img">` : ``;

    const infowindow = new kakao.maps.InfoWindow({
        content: `
            <div class="info-container">
                <div class="info-title">[${data.category || '기타'}] ${data.creatureName}</div>
                <div class="info-meta">
                    📍 <strong>장소:</strong> ${data.discoveryLocation}<br>
                    🧑‍🎓 <strong>발견자:</strong> ${data.studentInfo}
                </div>
                ${imageHtml}
                <div class="info-desc">
                    <strong>📝 특징 및 관찰내용:</strong><br>${data.observationDetails}
                </div>
                <div class="action-buttons" style="display:flex; gap:8px;">
                    <button class="info-btn edit-btn" onclick="triggerEditMode('${id}')" style="background:#ffa000;">✏️ 수정</button>
                    <button class="info-btn del-btn" onclick="triggerDeletePost('${id}')" style="background:#d32f2f;">❌ 삭제</button>
                </div>
            </div>`,
        removable: true
    });

    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker); 
    });

    allMarkersList.push({ id, category: data.category, markerInstance: marker, windowInstance: infowindow, data });
}

// 7. 수정 모드
window.triggerEditMode = function(id) {
    const item = allMarkersList.find(m => m.id === id);
    if (!item || !item.data) return;
    const data = item.data;

    if (currentMarker) { currentMarker.setMap(null); currentMarker = null; }

    document.getElementById('edit-doc-id').value = id;
    document.getElementById('student-info').value = data.studentInfo;
    document.getElementById('creature-category').value = data.category || "랜드마크";
    document.getElementById('creature-name').value = data.creatureName;
    document.getElementById('discovery-location').value = data.discoveryLocation;
    document.getElementById('observation-details').value = data.observationDetails;
    document.getElementById('lat').value = data.latitude;
    document.getElementById('lng').value = data.longitude;
    document.getElementById('display-lat').innerText = data.latitude.toFixed(6);
    document.getElementById('display-lng').innerText = data.longitude.toFixed(6);
    
    photoUploadInput.required = false;
    submitBtn.style.backgroundColor = "#ffa000";
    submitBtn.innerText = "수정 완료하기 ✏️";
    cancelEditBtn.style.display = "block";
    
    // 모바일 폼이 닫혀있다면 강제로 열어줍니다!
    if (window.innerWidth <= 768 && !isSidebarOpen) toggleSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 8. 삭제 모드
window.triggerDeletePost = async function(id) {
    const password = await bioPrompt("🔒 이 마커를 삭제하시려면 등록 시 설정한 비밀번호 4자리를 입력하세요:");
    if (!password) return;

    try {
        const docRef = db.collection("urban_nature").doc(id);
        const docSnap = await docRef.get();
        if (docSnap.data().password !== password) {
            await bioAlert("❌ 비밀번호가 올바르지 않습니다! 본인 데이터만 삭제할 수 있습니다."); return;
        }
        if (await bioConfirm("⚠️ 정말로 이 생태 마커를 지도에서 영구 삭제하시겠습니까?")) {
            await docRef.delete(); await bioAlert("🗑️ 마커가 지도에서 정상적으로 철거되었습니다.");
        }
    } catch (e) { alert("삭제 중 오류가 발생했습니다."); }
};

// 9. 필터 기능
function applyFilter(selectedCategory) {
    currentFilter = selectedCategory;
    allMarkersList.forEach(item => {
        if (selectedCategory === "all" || item.category === selectedCategory) {
            item.markerInstance.setMap(map);
        } else {
            item.markerInstance.setMap(null); item.windowInstance.close();
        }
    });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        applyFilter(this.getAttribute('data-category'));
    });
});

// 모달 제어 엔진
function showBioModal(options) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('bio-modal-overlay');
        const msgEl = document.getElementById('bio-modal-message');
        const inputEl = document.getElementById('bio-modal-input');
        const btnCancel = document.getElementById('bio-modal-btn-cancel');
        const btnOk = document.getElementById('bio-modal-btn-ok');

        msgEl.innerText = options.message;
        inputEl.value = "";
        inputEl.style.display = options.type === 'prompt' ? 'block' : 'none';
        btnCancel.style.display = (options.type === 'confirm' || options.type === 'prompt') ? 'block' : 'none';
        btnOk.style.width = options.type === 'alert' ? '100%' : '50%';
        
        overlay.style.display = 'flex';
        if (options.type === 'prompt') inputEl.focus();

        btnOk.onclick = () => { overlay.style.display = 'none'; resolve(options.type === 'prompt' ? inputEl.value : true); };
        btnCancel.onclick = () => { overlay.style.display = 'none'; resolve(options.type === 'prompt' ? null : false); };
    });
}

const bioAlert = (msg) => showBioModal({ type: 'alert', message: msg });
const bioConfirm = (msg) => showBioModal({ type: 'confirm', message: msg });
const bioPrompt = (msg) => showBioModal({ type: 'prompt', message: msg });
