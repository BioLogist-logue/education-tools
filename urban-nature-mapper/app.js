// 1. 파이어베이스 설정 (주인님의 실제 설정값으로 채워주세요!)
const firebaseConfig = {
  apiKey: "AIzaSyCQn32Fpt_Wxl0K1mw_SgKIZr1tERqte_I",
  authDomain: "urban-nature-mapper.firebaseapp.com",
  projectId: "urban-nature-mapper",
  storageBucket: "urban-nature-mapper.firebasestorage.app",
  messagingSenderId: "586767094407",
  appId: "1:586767094407:web:3650c6b4302ddcc52f1e22",
  measurementId: "G-GJXKEMTHD7"
};

// 파이어베이스 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// ❌ 이제 카드 등록이 필요한 storage 변수는 아예 쓰지 않습니다! 삭제 완료!

// 마법의 사진 압축 및 글자(Base64 DataURL) 변환 함수
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
                
                // ★ 핵심: 이미지를 쪼개지 않고 텍스트 형태(DataURL)로 바로 꽉 짜서 반환합니다.
                const base64Data = canvas.toDataURL('image/jpeg', quality);
                resolve(base64Data);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// 카카오맵 로딩 자물쇠 가동
const kakaoScript = document.createElement('script');
kakaoScript.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=7b524f0e08bfd50ca987b189ec057695&autoload=false';
kakaoScript.async = true;
document.head.appendChild(kakaoScript);

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
            submitBtn.innerText = "이미지 처리 및 업로드 중... ⏳";
            
            const studentInfo = document.getElementById('student-info').value;
            const creatureName = document.getElementById('creature-name').value;
            const discoveryLocation = document.getElementById('discovery-location').value;
            const observationDetails = document.getElementById('observation-details').value;
            const photoFile = document.getElementById('photo-upload').files[0];
            
            try {
                // 원본 사진을 800px 용량 다이어트 거쳐서 텍스트 문자열로 변환!
                const base64Image = await compressAndToBase64(photoFile, 800, 0.75);
                
                // 유료인 Storage를 거치지 않고, 100% 무료인 Firestore에 직접 꽂아버리기!
                await db.collection("urban_nature").add({
                    studentInfo: studentInfo,
                    creatureName: creatureName,
                    discoveryLocation: discoveryLocation,
                    observationDetails: observationDetails,
                    imageUrl: base64Image, // 사진 파일 대신 사진 글자가 들어갑니다!
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
                alert("❌ 등록에 실패했습니다. 파이어베이스 Firestore 규칙을 확인해 주세요.");
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

        // 마커 생성 및 인포윈도우 함수 (동일하게 작동!)
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
