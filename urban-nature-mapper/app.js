// ==========================================
// 🛡️ [초특급 방어막] 전역 CSS가 카카오 지도 타일을 부수는 현상 영구 차단
// ==========================================
const cssShield = document.createElement('style');
cssShield.innerHTML = `#map img { max-width: none !important; height: auto !important; }`;
document.head.appendChild(cssShield);

// 1. 파이어베이스 세팅 완벽 바인딩
const firebaseConfig = {
  apiKey: "AIzaSyCQn32Fpt_Wxl0K1mw_SgKIZr1tERqte_I",
  authDomain: "urban-nature-mapper.firebaseapp.com",
  projectId: "urban-nature-mapper",
  storageBucket: "urban-nature-mapper.firebasestorage.app",
  messagingSenderId: "586767094407",
  appId: "1:586767094407:web:3650c6b4302ddcc52f1e22",
  measurementId: "G-GJXKEMTHD7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 전역 관리 배열 기지
let allMarkersList = [];
let currentFilter = "all"; 
let isInitialLoad = true; 

// [주인님 전용 컬러 바인딩]
const markerColorSettings = {
    "생산자": "#2e7d32",   // 🟢 초록색
    "소비자": "#ffeb3b",   // 💛 노란색
    "분해자": "#d32f2f",   // 🔴 빨간색
    "랜드마크": "#1565c0"  // 🔵 파란색
};

// 이미지 압축기
function compressAndToBase64(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const base64Data = canvas.toDataURL('image/jpeg', quality);
                resolve(base64Data);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// 2. 카카오 지도 안착
const mapContainer = document.getElementById('map');
const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), 
    level: 3 
};
const map = new kakao.maps.Map(mapContainer, mapOption);

// 브라우저 창 크기가 바뀔 때 지도 타일을 자동으로 리프레시해주는 안전장치
window.addEventListener('resize', function() {
    map.relayout();
});

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        if (allMarkersList.length === 0) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setCenter(new kakao.maps.LatLng(lat, lng));
        }
    });
}

// 3. 지도 클릭 시 신규 핀 위치 배정 (마커 중복 적층 전면 차단)
let currentMarker = null;
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    // ⭕ [완벽 방어] 클릭 신호가 생태 핀(custom-pin)에서 올라온 거라면 지도 클릭 로직을 셧다운하라!
    if (mouseEvent.domEvent.target.classList.contains('custom-pin')) {
        return;
    }

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
});

// 4. 데이터 저장 및 수정(Submit) 융합 처리기
const form = document.getElementById('observation-form');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const photoUploadInput = document.getElementById('photo-upload');

form.addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const editDocId = document.getElementById('edit-doc-id').value;
    
    if (!lat || !lng) {
        await bioAlert("❌ 지도에서 발견 위치를 먼저 클릭해 주세요!");
        return;
    }
    
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
        if (photoFile) {
            finalImageUrl = await compressAndToBase64(photoFile, 800, 0.75);
        }

        if (editDocId) {
            const docRef = db.collection("urban_nature").doc(editDocId);
            const docSnap = await docRef.get();
            
            if (docSnap.data().password !== password) {
                await bioAlert("❌ 비밀번호가 틀렸습니다! 본인이 등록한 글만 수정할 수 있습니다.");
                submitBtn.disabled = false;
                submitBtn.innerText = "수정 완료하기 ✏️";
                return;
            }

            let updateData = {
                studentInfo: studentInfo,
                category: creatureCategory,
                creatureName: creatureName,
                discoveryLocation: discoveryLocation,
                observationDetails: observationDetails,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
            };
            if (finalImageUrl) updateData.imageUrl = finalImageUrl;

            await docRef.update(updateData);
            await bioAlert("✏️ 성공적으로 정보가 수정되었습니다!");
            resetFormState();
        } else {
            if (!photoFile) {
                await bioAlert("❌ 생물 사진을 등록해 주세요!");
                submitBtn.disabled = false;
                submitBtn.innerText = "생태 지도에 등록하기 🚀";
                return;
            }
            await db.collection("urban_nature").add({
                studentInfo: studentInfo,
                category: creatureCategory,
                creatureName: creatureName,
                discoveryLocation: discoveryLocation,
                observationDetails: observationDetails,
                imageUrl: finalImageUrl, 
                password: password, 
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            await bioAlert("🎉 생태 지도 등록 완료!");
            resetFormState();
        }
    } catch (error) {
        console.error(error);
        alert("❌ 동기화 실패. 네트워크 상태를 확인하세요.");
    } finally {
        submitBtn.disabled = false;
    }
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
}

cancelEditBtn.addEventListener('click', resetFormState);

// 5. 리얼타임 데이터 동기화 엔진
db.collection("urban_nature").onSnapshot((snapshot) => {
    const bounds = new kakao.maps.LatLngBounds();
    let hasValidMarkers = false;

    snapshot.docChanges().forEach((change) => {
        const id = change.doc.id;
        const data = change.doc.data();

        if (change.type === "added") {
            createEcoMarker(id, data);
        } else if (change.type === "modified") {
            removeMarkerFromMap(id);
            createEcoMarker(id, data);
        } else if (change.type === "removed") {
            removeMarkerFromMap(id);
        }
    });

    if (isInitialLoad && allMarkersList.length > 0) {
        allMarkersList.forEach(item => {
            if (item.markerInstance) {
                bounds.extend(item.markerInstance.getPosition());
                hasValidMarkers = true;
            }
        });
        
        if (hasValidMarkers) {
            map.setBounds(bounds); 
            map.relayout(); // 초기 로드 시 깨진 타일 강제 복구
        }
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

// 6. 🌟 [버그 완전 박멸] 브라우저 정품 하드웨어 DOM 바인딩 마커 빌더
function createEcoMarker(id, data) {
    if (!data.latitude || !data.longitude) return;

    const color = markerColorSettings[data.category] || "#1565c0";
    const pos = new kakao.maps.LatLng(data.latitude, data.longitude);

    // 가짜 텍스트 대신 진짜 브라우저 HTML 노드로 핀을 조각합니다.
    const pinNode = document.createElement('div');
    pinNode.className = 'custom-pin';
    pinNode.style.width = '20px';
    pinNode.style.height = '20px';
    pinNode.style.backgroundColor = color;
    pinNode.style.border = '3px solid white';
    pinNode.style.borderRadius = '50%';
    pinNode.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
    pinNode.style.cursor = 'pointer';

    const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: pinNode, // DOM 객체를 정석대로 결합
        map: currentFilter === "all" || currentFilter === data.category ? map : null,
        xAnchor: 0.5, // 마커의 정중앙이 좌표에 오도록 고정
        yAnchor: 0.5
    });

    const imageHtml = data.imageUrl ? `<img src="${data.imageUrl}" style="max-width:100%; height:auto; margin:8px 0; display:block; border-radius:4px;">` : `<p style="margin:4px 0; color:#888; font-size:12px;">(사진 없음)</p>`;

    const infowindow = new kakao.maps.InfoWindow({
        content: `
            <div class="infowindow-content" style="padding:10px; min-width:160px;">
                <div class="infowindow-title" style="font-weight:bold; margin-bottom:5px;">[${data.category || '기타'}] ${data.creatureName}</div>
                <div class="infowindow-meta" style="font-size:11px; color:#666; margin-bottom:5px;">📍 ${data.discoveryLocation} (${data.studentInfo})</div>
                ${imageHtml}
                <div style="font-size:13px; margin-bottom:8px;"><strong>특징:</strong> ${data.observationDetails}</div>
                <div class="action-buttons" style="display:flex; gap:4px;">
                    <button class="action-btn edit-btn" onclick="triggerEditMode('${id}')" style="cursor:pointer; padding:2px 6px; font-size:11px;">✏️ 수정</button>
                    <button class="action-btn del-btn" onclick="triggerDeletePost('${id}')" style="cursor:pointer; padding:2px 6px; font-size:11px;">❌ 삭제</button>
                </div>
            </div>`,
        removable: true
    });

    // ⭕ [마법의 버블링 차단 쉴드] 핀 주위의 모든 마우스 이벤트를 완벽 포획하여 지도 배경으로 절대 흘러가지 않게 차단!
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
        pinNode.addEventListener(eventType, function(event) {
            if (event && event.stopPropagation) {
                event.stopPropagation(); // 이 선언 덕분에 지도 위에 파란 마커가 중복 적층되는 현상이 100% 영구 박멸됩니다!
            }
        });
    });

    // 오직 순수한 클릭 시에만 정보창을 활성화시킨다!
    pinNode.addEventListener('click', function() {
        infowindow.open(map, overlay);
    });

    allMarkersList.push({ id, category: data.category, markerInstance: overlay, windowInstance: infowindow, data });
}

// 7. 수정 모드
window.triggerEditMode = function(id) {
    const item = allMarkersList.find(m => m.id === id);
    if (!item || !item.data) return;
    const data = item.data;

    if (currentMarker) {
        currentMarker.setMap(null);
        currentMarker = null;
    }

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
    
    document.getElementById('sidebar').scrollTop = 0;
};

// 8. 삭제 모드
window.triggerDeletePost = async function(id) {
    const password = await bioPrompt("🔒 이 마커를 삭제하시려면 등록 시 설정한 비밀번호 4자리를 입력하세요:");
    if (!password) return;

    try {
        const docRef = db.collection("urban_nature").doc(id);
        const docSnap = await docRef.get();
        
        if (docSnap.data().password !== password) {
            await bioAlert("❌ 비밀번호가 올바르지 않습니다! 본인 데이터만 삭제할 수 있습니다.");
            return;
        }

        if (await bioConfirm("⚠️ 정말로 이 생태 마커를 지도에서 영구 삭제하시겠습니까?")) {
            await docRef.delete();
            await bioAlert("🗑️ 마커가 지도에서 정상적으로 철거되었습니다.");
        }
    } catch (e) {
        alert("삭제 중 오류가 발생했습니다.");
    }
};

// 9. 필터 기능
function applyFilter(selectedCategory) {
    currentFilter = selectedCategory;
    allMarkersList.forEach(item => {
        if (selectedCategory === "all" || item.category === selectedCategory) {
            item.markerInstance.setMap(map);
        } else {
            item.markerInstance.setMap(null);
            item.windowInstance.close();
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

// ==========================================
// 팝업 가로채기 모달 제어 엔진
// ==========================================
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
        
        if (options.type === 'alert') {
            btnOk.style.width = '100%';
        } else {
            btnOk.style.width = '50%';
        }

        overlay.style.display = 'flex';
        if (options.type === 'prompt') inputEl.focus();

        btnOk.onclick = () => {
            overlay.style.display = 'none';
            if (options.type === 'prompt') {
                resolve(inputEl.value);
            } else {
                resolve(true);
            }
        };

        btnCancel.onclick = () => {
            overlay.style.display = 'none';
            if (options.type === 'prompt') {
                resolve(null);
            } else {
                resolve(false);
            }
        };
    });
}

const bioAlert = (msg) => showBioModal({ type: 'alert', message: msg });
const bioConfirm = (msg) => showBioModal({ type: 'confirm', message: msg });
const bioPrompt = (msg) => showBioModal({ type: 'prompt', message: msg });
