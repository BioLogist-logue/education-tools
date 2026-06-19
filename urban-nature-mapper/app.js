// 1. 파이어베이스 설정 (주인님의 파이어베이스 프로젝트 설정값으로 바꾸셔야 합니다!)
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 파이어베이스 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// 2. 카카오 지도 초기화
const mapContainer = document.getElementById('map');
const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 기본 중심좌표 (서울시청)
    level: 3 // 지도의 확대 레벨
};

const map = new kakao.maps.Map(mapContainer, mapOption);

// 현재 위치 가져오기 (학생들이 현장에서 스마트폰으로 접속했을 때 현재 위치로 지도 이동)
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const locPosition = new kakao.maps.LatLng(lat, lng);
        map.setCenter(locPosition);
    });
}

// 3. 지도 클릭 이벤트 (클릭한 곳에 임시 마커를 띄우고 폼에 위도/경도 입력)
let currentMarker = null;

kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    const latlng = mouseEvent.getLatLng();
    
    // 기존 임시 마커가 있으면 위치만 이동, 없으면 새로 생성
    if (currentMarker === null) {
        currentMarker = new kakao.maps.Marker({
            position: latlng,
            map: map
        });
    } else {
        currentMarker.setPosition(latlng);
    }
    
    // HTML 폼에 위도 경도 값 넣어주기
    document.getElementById('lat').value = latlng.getLat();
    document.getElementById('lng').value = latlng.getLng();
    document.getElementById('display-lat').innerText = latlng.getLat().toFixed(6);
    document.getElementById('display-lng').innerText = latlng.getLng().toFixed(6);
});

// 4. 데이터 등록 (폼 서브밋 이벤트)
// ====== [새로 추가된 마법의 사진 압축 함수] ======
function compressImage(file, maxWidth, quality) {
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

                // 사진의 가로가 지정한 최대 크기(예: 800px)보다 크면 비율 맞춰 줄임
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 압축된 이미지 데이터를 Blob 형태로 변환 (JPEG 화질 75% 수준)
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}
// ===================================================

// 4. 데이터 등록 및 파이어베이스 전송 (업그레이드 버전!)
const form = document.getElementById('observation-form');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async function(e) {
    e.preventDefault(); 
    
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    
    if (!lat || !lng) {
        alert("❌ 지도에서 생물을 발견한 정확한 위치를 클릭해 주세요!");
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerText = "이미지 압축 및 업로드 중... ⏳"; // 문구 수정!
    
    const studentInfo = document.getElementById('student-info').value;
    const creatureName = document.getElementById('creature-name').value;
    const discoveryLocation = document.getElementById('discovery-location').value;
    const observationDetails = document.getElementById('observation-details').value;
    const photoFile = document.getElementById('photo-upload').files[0];
    
    try {
        // [★ 핵심] 업로드 직전 사진을 가로 800px, 화질 75%로 자동 압축!!
        const compressedBlob = await compressImage(photoFile, 800, 0.75);
        
        // [A] 압축된 파일(compressedBlob)을 스토리지에 저장
        const storageRef = storage.ref(`nature_photos/${Date.now()}_compressed.jpg`);
        const uploadTask = await storageRef.put(compressedBlob); // 원본 대신 압축본 투입!
        const imageUrl = await uploadTask.ref.getDownloadURL();
        
        // [B] Firestore 데이터베이스에 텍스트와 이미지 경로 저장
        await db.collection("urban_nature").add({
            studentInfo: studentInfo,
            creatureName: creatureName,
            discoveryLocation: discoveryLocation,
            observationDetails: observationDetails,
            imageUrl: imageUrl,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("🎉 생태 지도 등록 완료! 마커가 실시간으로 지도에 표시됩니다.");
        form.reset();
        if (currentMarker) currentMarker.setMap(null); 
        currentMarker = null;
        document.getElementById('display-lat').innerText = "지도에서 위치를 클릭하세요";
        document.getElementById('display-lng').innerText = "지도에서 위치를 클릭하세요";
        
    } catch (error) {
        console.error("오류 발생: ", error);
        alert("❌ 등록에 실패했습니다. 키 설정을 다시 확인해 주세요.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "생태 지도에 등록하기 🚀";
    }
});

// 5. 실시간 데이터 동기화 (DB에 데이터가 들어오면 지도에 자동으로 핀 꽂기)
db.collection("urban_nature").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data();
            createEcoMarker(data);
        }
    });
});

// 지도에 학생들의 관찰 핀을 꽂고 인포윈도우(팝업)를 연결하는 함수
function createEcoMarker(data) {
    const markerPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
    
    // 학생용 마커 생성 (구분을 위해 기본 마커 사용 혹은 커스텀 이미지 가능)
    const marker = new kakao.maps.Marker({
        position: markerPosition,
        map: map
    });
    
    // 인포윈도우에 들어갈 HTML 콘텐츠 구성
    const iwContent = `
        <div class="infowindow-content">
            <div class="infowindow-title">🌱 ${data.creatureName}</div>
            <div class="infowindow-meta">📍 ${data.discoveryLocation} (${data.studentInfo})</div>
            <img src="${data.imageUrl}" alt="${data.creatureName}">
            <div><strong>관찰 특징:</strong> ${data.observationDetails}</div>
        </div>
    `;
    
    // 인포윈度우 생성
    const infowindow = new kakao.maps.InfoWindow({
        content: iwContent,
        removable: true // 닫기 버튼 활성화
    });
    
    // 마커 클릭 시 인포윈도우가 뜨도록 이벤트 등록
    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
}
