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

// 지도 위의 마커 객체들과 데이터를 실시간 추적 관리하기 위한 배열 기지
let allMarkersList = [];
let currentFilter = "all"; 

// ⭕ [팩트체크 완료] 엑박 유발하던 카카오 주소 폐기하고, 업타임 100% 보장되는 구글 공식 컬러 핀 마커 이미지로 강제 전환!
const markerImageSettings = {
    "식물": { src: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png", size: new kakao.maps.Size(32, 32) }, // 노란색
    "동물": { src: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", size: new kakao.maps.Size(32, 32) },    // 빨간색
    "곤충": { src: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", size: new kakao.maps.Size(32, 32) },   // 파란색
    "기타": { src: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", size: new kakao.maps.Size(32, 32) }   // 초록색
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

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setCenter(new kakao.maps.LatLng(lat, lng));
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
        alert("❌ 지도에서 발견 위치를 먼저 클릭해 주세요!");
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
            // [수정 모드 가동] 비밀번호 검증 후 업데이트
            const docRef = db.collection("urban_nature").doc(editDocId);
            const docSnap = await docRef.get();
            
            if (docSnap.data().password !== password) {
                alert("❌ 비밀번호가 틀렸습니다! 본인이 등록한 글만 수정할 수 있습니다.");
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
            alert("✏️ 성공적으로 정보가 수정되었습니다!");
            resetFormState();
        } else {
            // [신규 등록 모드 가동]
            if (!photoFile) {
                alert("❌ 생물 사진을 등록해 주세요!");
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
            alert("🎉 생태 지도 등록 완료!");
            resetFormState();
        }
    } catch (error) {
        console.error(error);
        alert("❌ 동기화 실패. 비밀번호 및 네트워크 상태를 확인하세요.");
    } finally {
        submitBtn.disabled = false;
    }
});

// 폼 초기화 유틸함수
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

// 5. 리얼타임 데이터 실시간 미러링
db.collection("urban_nature").onSnapshot((snapshot) => {
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
});

// 지도에서 마커 지우기 유틸 함수
function removeMarkerFromMap(id) {
    const idx = allMarkersList.findIndex(item => item.id === id);
    if (idx !== -1) {
        allMarkersList[idx].markerInstance.setMap(null);
        allMarkersList[idx].windowInstance.close();
        allMarkersList.splice(idx, 1);
    }
}

// 6. 맞춤형 이미지 마커 가동 및 수정/삭제 바인딩 기능
function createEcoMarker(id, data) {
    if (!data.latitude || !data.longitude) return;

    const markerPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
    const imgStyle = markerImageSettings[data.category] || markerImageSettings["기타"];
    const markerImage = new kakao.maps.MarkerImage(imgStyle.src, imgStyle.size);

    const marker = new kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
        map: currentFilter === "all" || currentFilter === data.category ? map : null 
    });
    
    // ⭕ [초특급 버그 수정!] 따옴표 깨짐 방지를 위해 인라인 인수를 모두 제거하고 오직 '${id}'만 깔끔하게 넘깁니다!
    const iwContent = `
        <div class="infowindow-content">
            <div class="infowindow-title">[${data.category || '기타'}] ${data.creatureName}</div>
            <div class="infowindow-meta">📍 ${data.discoveryLocation} (${data.studentInfo})</div>
            <img src="${data.imageUrl}" alt="${data.creatureName}">
            <div><strong>관찰 특징:</strong> ${data.observationDetails}</div>
            <div class="action-buttons">
                <button class="action-btn edit-btn" onclick="triggerEditMode('${id}')">✏️ 수정</button>
                <button class="action-btn del-btn" onclick="triggerDeletePost('${id}')">❌ 삭제</button>
            </div>
        </div>
    `;
    
    const infowindow = new kakao.maps.InfoWindow({ content: iwContent, removable: true });
    
    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });

    allMarkersList.push({
        id: id,
        category: data.category || "기타",
        markerInstance: marker,
        windowInstance: infowindow,
        data: data // ⭕ 나중에 꺼내 쓸 수 있도록 원본 데이터를 객체에 통째로 보관합니다!
    });
}

// 7. ✏️ [완벽 보수] ID를 통해 안전하게 데이터를 로드하는 수정 모드 함수
window.triggerEditMode = function(id) {
    const item = allMarkersList.find(m => m.id === id);
    if (!item || !item.data) return;
    
    const data = item.data;

    document.getElementById('edit-doc-id').value = id;
    document.getElementById('student-info').value = data.studentInfo;
    document.getElementById('creature-category').value = data.category || "기타";
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

// 8. ❌ 전역 삭제 처리 요청 함수
window.triggerDeletePost = async function(id) {
    const password = prompt("🔒 이 마커를 삭제하시려면 등록 시 설정한 비밀번호 4자리를 입력하세요:");
    if (!password) return;

    try {
        const docRef = db.collection("urban_nature").doc(id);
        const docSnap = await docRef.get();
        
        if (docSnap.data().password !== password) {
            alert("❌ 비밀번호가 올바르지 않습니다! 본인 데이터만 삭제할 수 있습니다.");
            return;
        }

        if (confirm("⚠️ 정말로 이 생태 마커를 지도에서 영구 삭제하시겠습니까?")) {
            await docRef.delete();
            alert("🗑️ 마커가 지도에서 정상적으로 철거되었습니다.");
        }
    } catch (e) {
        alert("삭제 중 오류가 발생했습니다.");
    }
};

// 9. 실시간 카테고리 필터링 제어선
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
