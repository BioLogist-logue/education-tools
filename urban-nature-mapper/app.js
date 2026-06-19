// 1. 파이어베이스 설정 (주인님의 실제 설정값으로 꼭 채워주세요!)
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

// 사진 압축 함수
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
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', quality);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// 🔴 [마법의 구역] index.html 대신 app.js가 직접 카카오 지도를 안전하게 불러옵니다.
const kakaoScript = document.createElement('script');
kakaoScript.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=61f52db8267bc831d2afd5e704c3ac52&autoload=false';
kakaoScript.async = true;
document.head.appendChild(kakaoScript);

// 카카오 설계도가 완전히 내 컴퓨터에 다운로드 완료되면 실행되는 안전장치
kakaoScript.onload = () => {
    kakao.maps.load(function() {
        
        // 2. 카카오 지도 초기화
        const mapContainer = document.getElementById('map');
        const mapOption = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 3
        };
        const map = new kakao.maps.Map(mapContainer, mapOption);

        // 현재 위치 가져오기
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const locPosition = new kakao.maps.LatLng(lat, lng);
                map.setCenter(locPosition);
            });
        }

        // 3. 지도 클릭 이벤트
        let currentMarker = null;
        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
            const latlng = mouseEvent.getLatLng();
            if (currentMarker === null) {
                currentMarker = new kakao.maps.Marker({
                    position: latlng,
                    map: map
                });
            } else {
                currentMarker.setPosition(latlng);
            }
            document.getElementById('lat').value = latlng.getLat();
            document.getElementById('lng').value = latlng.getLng();
            document.getElementById('display-lat').innerText = latlng.getLat().toFixed(6);
            document.getElementById('display-lng').innerText = latlng.getLng().toFixed(6);
        });

        // 4. 데이터 등록 및 파이어베이스 전송
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
            submitBtn.innerText = "이미지 압축 및 업로드 중... ⏳";
            
            const studentInfo = document.getElementById('student-info').value;
            const creatureName = document.getElementById('creature-name').value;
            const discoveryLocation = document.getElementById('discovery-location').value;
            const observationDetails = document.getElementById('observation-details').value;
            const photoFile = document.getElementById('photo-upload').files[0];
            
            try {
                const compressedBlob = await compressImage(photoFile, 800, 0.75);
                const storageRef = storage.ref(`nature_photos/${Date.now()}_compressed.jpg`);
                const uploadTask = await storageRef.put(compressedBlob); 
                const imageUrl = await uploadTask.ref.getDownloadURL();
                
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

        // 5. 실시간 데이터 동기화
        db.collection("urban_nature").onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    createEcoMarker(data);
                }
            });
        });

        // 마커 생성 및 인포윈도우 함수
        function createEcoMarker(data) {
            const markerPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
            const marker = new kakao.maps.Marker({
                position: markerPosition,
                map: map
            });
            
            const iwContent = `
                <div class="infowindow-content">
                    <div class="infowindow-title">🌱 ${data.creatureName}</div>
                    <div class="infowindow-meta">📍 ${data.discoveryLocation} (${data.studentInfo})</div>
                    <img src="${data.imageUrl}" alt="${data.creatureName}">
                    <div><strong>관찰 특징:</strong> ${data.observationDetails}</div>
                </div>
            `;
            
            const infowindow = new kakao.maps.InfoWindow({
                content: iwContent,
                removable: true 
            });
            
            kakao.maps.event.addListener(marker, 'click', function() {
                infowindow.open(map, marker);
            });
        }

    });
};
