// ==========================================
// 🛡️ [모바일 찢어짐 방지 철갑 쉴드] 
// ==========================================
const mapShield = document.createElement('style');
mapShield.innerHTML = `
#map { overflow: hidden !important; }
#map img { 
    max-width: none !important; 
    max-height: none !important; 
    box-sizing: content-box !important;
}
`;
document.head.appendChild(mapShield);

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

// 중복 초기화 방지
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 전역 상태 변수
let allMarkersList = [];
let currentFilter = "all"; 
let isInitialLoad = true; 

// ⭕ [신기술 적용] 외부 이미지 URL 엑박 영구 박멸용 SVG 하드코딩!
const svgPins = {
    "생산자": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%232e7d32%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E",
    "소비자": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%23ffeb3b%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E",
    "분해자": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%23d32f2f%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E",
    "랜드마크": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 36%22%3E%3Cpath fill%3D%22%231565c0%22 d%3D%22M12 0C5.373 0 0 5.373 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.627-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z%22%2F%3E%3C%2Fsvg%3E"
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
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
        reader.onerror = error => reject(error);
    });
}

// 2. 카카오 지도 안착
const mapContainer = document.getElementById('map');
const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), 
    level: 3 
};
const map = new kakao.maps.Map(mapContainer, mapOption);

// 🌟 [핵심 처방전: 모바일 호흡기 장착!] 🌟
// 모바일 화면 주소창이 접히거나/펴질 때 지도가 찢어지는 것을 막는 공식 옵저버
if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
        const currentCenter = map.getCenter(); // 중심점 기억
        map.relayout(); // 퍼즐 강제 재조립
        map.setCenter(currentCenter); // 중심점 복원
    });
    resizeObserver.observe(mapContainer);
}

// 모바일 네트워크 지연으로 인한 초기 깨짐 방지용 3연단 콤보!
setTimeout(() => map.relayout(), 500);
setTimeout(() => map.relayout(), 1000);
setTimeout(() => map.relayout(), 2000);

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
        if (photoFile) finalImageUrl = await compressAndToBase64(photoFile, 800, 0.75);

        if (editDocId) {
            const docRef = db.collection("urban_nature").doc(editDocId);
            const docSnap = await docRef.get();
            
            if (docSnap.data().password !== password) {
                await bioAlert("❌ 비밀번호가 틀렸습니다! 본인이 등록한 글만 수정할 수 있습니다.");
                submitBtn.disabled = false;
                submitBtn.innerText = "수정 완료하기 ✏️";
                return;
            }

            let updateData = { studentInfo, category: creatureCategory, creatureName, discoveryLocation, observationDetails, latitude: parseFloat(lat), longitude: parseFloat(lng) };
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
                studentInfo, category: creatureCategory, creatureName, discoveryLocation, observationDetails, imageUrl: finalImageUrl, password, latitude: parseFloat(lat), longitude: parseFloat(lng), timestamp: firebase.firestore.FieldValue.serverTimestamp()
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
            map.relayout(); // 초기 바운딩 후 리레이아웃
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

// 6. 🌟 [궁극의 무결점 렌더링] 진짜 마커로 정보창 버블링 에러 종결!
function createEcoMarker(id, data) {
    if (!data.latitude || !data.longitude) return;

    const pos = new kakao.maps.LatLng(data.latitude, data.longitude);
    const svgDataUri = svgPins[data.category] || svgPins["랜드마크"];
    
    const markerImage = new kakao.maps.MarkerImage(svgDataUri, new kakao.maps.Size(26, 38));

    const marker = new kakao.maps.Marker({
        position: pos,
        image: markerImage,
        map: currentFilter === "all" || currentFilter === data.category ? map : null
    });

    const imageHtml = data.imageUrl ? `<img src="${data.imageUrl}" style="max-width:100%; height:auto; margin:8px 0; display:block; border-radius:4px;">` : `<p style="margin:4px 0; color:#888; font-size:12px;">(사진 없음)</p>`;

    const infowindow = new kakao.maps.InfoWindow({
        content: `
            <div class="infowindow-content" style="padding:10px; min-width:160px; z-index:100;">
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

    // 진짜 카카오 마커 클릭 이벤트! 
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
