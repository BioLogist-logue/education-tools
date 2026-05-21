import streamlit as st
import streamlit.components.v1 as components
import py3Dmol
from stmol import showmol

# ==========================================
# [1] 페이지 기본 설정
# ==========================================
# 웹 브라우저 탭에 표시될 제목과 아이콘, 레이아웃(wide: 넓게 쓰기)을 설정합니다.
st.set_page_config(page_title="BioLogue 3D Lab", page_icon="🧬", layout="wide")


# ==========================================
# [2] 전체 디자인 및 CSS 설정 (다크모드 방어)
# ==========================================
# 💡 수정 팁: 폰트 색상(#0F172A), 포인트 색상(#20C997) 등을 바꾸고 싶을 때 여기서 수정하세요.
st.markdown("""
    <style>
    /* 1. 전체 배경 및 기본 텍스트 강제 설정 (다크모드 방어) */
    .stApp { background-color: #F8FAFC !important; }
    html, body, p, h1, h2, h3, h4, h5, h6, span, div, label {
        color: #0F172A !important;
        font-family: 'Pretendard', sans-serif;
    }
    
    /* 2. 메인 타이틀 및 서브 타이틀 디자인 */
    .main-title { color: #0F172A !important; font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 5px; }
    .sub-title { text-align: center; color: #475569 !important; font-size: 1.1rem; margin-bottom: 2rem; }
    
    /* 3. 모바일 환경을 위한 탭(Tab) 메뉴 가로 스크롤 설정 */
    .stTabs [data-baseweb="tab-list"] { 
        gap: 10px; justify-content: flex-start; overflow-x: auto; white-space: nowrap; flex-wrap: nowrap; padding-bottom: 5px;
    }
    .stTabs [data-baseweb="tab"] { 
        height: 50px; background-color: #FFFFFF; border-radius: 10px; 
        font-weight: 700; border: 1px solid #E2E8F0; padding: 0 20px;
    }
    .stTabs [aria-selected="true"] { background-color: #20C997 !important; color: white !important; }
    
    /* 4. 각종 입력창 및 선택창 다크모드 무력화 (무조건 흰배경/검은글씨) */
    input, textarea, select { background-color: #FFFFFF !important; color: #0F172A !important; border: 1px solid #CBD5E1 !important; }
    div[data-testid="stRadio"] p, div[data-testid="stRadio"] label { color: #0F172A !important; font-weight: 700; }
    div[data-testid="stTextInput"] label, div[data-testid="stTextInput"] p { color: #0F172A !important; }
    div[data-testid="stSelectbox"] label, div[data-testid="stSelectbox"] p { color: #0F172A !important; }
    
    /* 5. 드롭다운 메뉴(셀렉트박스)와 팝오버(유령메뉴) 완벽 하얗게 탈색 */
    div[data-baseweb="select"] > div { background-color: #FFFFFF !important; border-color: #CBD5E1 !important; color: #0F172A !important; }
    div[data-baseweb="select"] * { color: #0F172A !important; }
    div[data-baseweb="popover"], div[data-baseweb="popover"] * { background-color: #FFFFFF !important; color: #0F172A !important; }
    ul[data-baseweb="menu"] { background-color: #FFFFFF !important; }
    ul[data-baseweb="menu"] li { background-color: #FFFFFF !important; color: #0F172A !important; }
    ul[data-baseweb="menu"] li:hover { background-color: #F1F5F9 !important; } /* 마우스 오버 시 살짝 회색 */
    
    /* 6. 버튼 디자인 (개념 요약 보기 버튼 등) */
    .stButton > button, div[data-testid="stBaseButton-secondary"] p {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        border: 1px solid #CBD5E1 !important;
        font-weight: 700 !important;
        transition: all 0.2s;
    }
    
    /* 7. 개념 요약 박스 디자인 */
    .concept-box {
        background: #FFFFFF;
        padding: 20px;
        border-radius: 15px;
        border-left: 5px solid #20C997;
        margin-top: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    </style>
""", unsafe_allow_html=True)


# ==========================================
# [3] 3D 분자 렌더링 함수
# ==========================================
# 💡 수정 팁: 3D 모형의 가로/세로 비율이나, 기질(핑크색)의 크기를 조절할 때 여기서 수정하세요.
def render_molecule(pdb_id, is_preset=True):
    # width="100%"로 모바일 대응, height=550으로 PC에서도 큼직하게 보이게 설정
    viewer = py3Dmol.view(query=f"pdb:{pdb_id}", width="100%", height=550) 
    
    # 효소 단백질 기본 스타일: 무지개색 카툰 + 반투명 흰색 구름 표면
    viewer.setStyle({'cartoon': {'color': 'spectrum'}})
    viewer.addSurface(py3Dmol.VDW, {'opacity': 0.25, 'color': 'white'}, {'protein': True})
    
    if is_preset:
        # 추천 모드: 기질을 눈에 띄는 자홍색(magenta) 왕구슬(radius: 1.2)로 표현
        viewer.setStyle({'hetatm': True}, {'sphere': {'color': 'magenta', 'radius': 1.2}})
    else:
        # 자유 검색 모드: 기질을 표준 화학 원소 색상의 얇은 막대(stick)로 표현
        viewer.setStyle({'hetatm': True}, {'stick': {'colorscheme': 'JmolElements', 'radius': 0.3}})
    
    viewer.zoomTo()
    showmol(viewer, height=550, width="100%")


# ==========================================
# [4] 메인 UI 구성 (타이틀 및 탭)
# ==========================================
st.markdown("<div class='main-title'>BioLogue 3D Lab</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>실제 분자 데이터와 가상 실험을 통해 효소의 원리를 마스터합니다.</div>", unsafe_allow_html=True)

# 2개의 탭 생성
tab1, tab2 = st.tabs(["🔍 실제 구조 관찰 (PDB)", "🧪 가상 결합 실험 (Concept)"])

# 선택된 효소 이름을 저장할 전역 변수 초기화
selected_name = "미지정"


# ==========================================
# [5] 탭 1: 실제 구조 관찰 (PDB)
# ==========================================
with tab1:
    col1, col2 = st.columns([1, 3])
    
    # 💡 수정 팁: 새로운 효소를 추가하고 싶다면 이 딕셔너리에 "이름": "PDB코드" 형식으로 추가하세요.
    enzyme_presets = {
        "리소자임(Lysozyme) + 기질": "1HEW",
        "글루코키나제(Glucokinase) + 포도당": "2H4F",
        "카탈레이스(Catalase)": "1QQW"
    }
    
    # 5-1. 왼쪽 컨트롤 패널
    with col1:
        st.markdown("### 🔬 관찰 설정")
        mode = st.radio("모드 선택", ["추천 복합체", "직접 검색"], horizontal=True)
        
        if mode == "추천 복합체":
            sel = st.selectbox("효소 선택", list(enzyme_presets.keys()))
            target_pdb = enzyme_presets[sel]
            is_preset_mode = True
            selected_name = sel
            st.info("💡 기질이 결합된 상태를 관찰합니다.")
        else:
            user_input = st.text_input("RCSB PDB ID 4자리를 입력하세요 (예: 1QQW):", "1QQW")
            target_pdb = user_input.strip().upper()
            is_preset_mode = False
            selected_name = f"사용자 정의 검색 ({target_pdb})"
            st.info("🌐 [RCSB PDB 공식 사이트](https://www.rcsb.org/)에서 4자리 코드를 찾아 입력하세요.")
            
    # 5-2. 오른쪽 3D 뷰어
    with col2:
        if target_pdb:
            render_molecule(target_pdb, is_preset=is_preset_mode)


# ==========================================
# [6] 탭 2: 가상 결합 실험 (HTML/JS 임베딩)
# ==========================================
# 💡 수정 팁: 시뮬레이터 내부의 글씨, 색상, 애니메이션 속도를 바꾸고 싶을 때 이 부분을 수정하세요.
with tab2:
    st.markdown("### 🧪 효소-기질 결합 시뮬레이션 (자물쇠와 열쇠 모델)")
    
    inline_virtual_lab = """
    <!DOCTYPE html>
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* 레이아웃 및 폰트 설정 */
      body { font-family: 'Pretendard', sans-serif; display: flex; flex-direction: column; align-items: center; background: #ffffff; padding: 10px; margin: 0; }
      
      /* 상단 버튼 컨트롤러 영역 */
      .controls { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 20px; background: #F8FAFC; padding: 15px; border-radius: 15px; border: 1px solid #E2E8F0; width: 100%; box-sizing: border-box; }
      .control-group { text-align: center; }
      .btn { padding: 8px 12px; margin: 3px; border: none; border-radius: 5px; background: #CBD5E1; cursor: pointer; font-weight: bold; color: #0F172A; transition: 0.2s; font-size: 0.9rem; }
      .btn.active-e { background: #20C997; color: white; } /* 활성화된 효소 버튼 색상 */
      .btn.active-s { background: #EC4899; color: white; } /* 활성화된 기질 버튼 색상 */
      
      /* 애니메이션 무대 (모바일 반응형 100%) */
      .stage { width: 100%; max-width: 600px; height: 220px; border: 2px dashed #94A3B8; border-radius: 15px; position: relative; overflow: hidden; background: #F8FAFC; margin-bottom: 20px; box-sizing: border-box; }
      
      /* 효소와 기질 디자인 (CSS 도형) */
      .enzyme { width: 130px; height: 130px; background: #20C997; border-radius: 20px; position: absolute; left: 10px; top: 45px; display: flex; align-items: center; justify-content: flex-end; box-shadow: 5px 5px 15px rgba(0,0,0,0.1); }
      .active-site { width: 45px; height: 45px; background: #F8FAFC; margin-right: -1px; transition: 0.3s; }
      .substrate { width: 42px; height: 42px; background: #EC4899; position: absolute; right: 10px; top: 89px; transition: all 0.8s ease-in-out; box-shadow: 2px 2px 10px rgba(0,0,0,0.2); z-index: 10; }
      
      /* 모양 정의 (클립패스 활용) */
      .shape-triangle { clip-path: polygon(100% 50%, 0 0, 0 100%); }
      .shape-square { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
      .shape-circle { border-radius: 50%; width: 44px; height: 44px; }
      
      /* 하단 반응 시작 버튼 및 상태 텍스트 */
      .action-btn { background: #0F172A; color: white; padding: 12px 30px; font-size: 1.1rem; border-radius: 30px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 10px; }
      .action-btn:hover { background: #334155; }
      #status { font-size: 1rem; font-weight: bold; color: #475569; text-align: center; min-height: 48px; }
    </style>
    </head>
    <body>
      <div class="controls">
        <div class="control-group">
          <h4 style="margin:0 0 10px 0; font-size: 1rem;">1. 효소 (활성 부위)</h4>
          <button class="btn active-e" id="e-triangle" onclick="setEnzyme('triangle')">세모</button>
          <button class="btn" id="e-square" onclick="setEnzyme('square')">네모</button>
          <button class="btn" id="e-circle" onclick="setEnzyme('circle')">동그라미</button>
        </div>
        <div class="control-group">
          <h4 style="margin:0 0 10px 0; font-size: 1rem;">2. 기질 (투입 모양)</h4>
          <button class="btn active-s" id="s-triangle" onclick="setSubstrate('triangle')">세모</button>
          <button class="btn" id="s-square" onclick="setSubstrate('square')">네모</button>
          <button class="btn" id="s-circle" onclick="setSubstrate('circle')">동그라미</button>
        </div>
      </div>
      
      <div class="stage" id="sim-stage">
        <div class="enzyme"><div id="activeSite" class="active-site shape-triangle"></div></div>
        <div id="substrate" class="substrate shape-triangle"></div>
      </div>
      
      <button class="action-btn" onclick="react()">기질 투입 (반응 시작)</button>
      <div id="status">활성 부위와 기질의 모양을 맞추고 투입해보세요!</div>

      <script>
        let eShape = 'triangle'; let sShape = 'triangle';
        
        // 효소 모양 변경 함수
        function setEnzyme(shape) {
            eShape = shape;
            document.getElementById('activeSite').className = 'active-site shape-' + shape;
            document.querySelectorAll('[id^="e-"]').forEach(b => b.classList.remove('active-e'));
            document.getElementById('e-' + shape).classList.add('active-e');
            resetSubstrate();
        }
        
        // 기질 모양 변경 함수
        function setSubstrate(shape) {
            sShape = shape;
            document.getElementById('substrate').className = 'substrate shape-' + shape;
            document.querySelectorAll('[id^="s-"]').forEach(b => b.classList.remove('active-s'));
            document.getElementById('s-' + shape).classList.add('active-s');
            resetSubstrate();
        }
        
        // 기질 위치 초기화 함수
        function resetSubstrate() {
            let sub = document.getElementById('substrate');
            sub.style.transform = 'translateX(0) rotate(0deg)';
            sub.style.opacity = '1';
            document.getElementById('status').innerText = '활성 부위와 기질의 모양을 맞추고 투입해보세요!';
            document.getElementById('status').style.color = '#475569';
        }
        
        // 반응 애니메이션 함수 (화면 크기에 맞춰 이동 거리 자동 계산)
        function react() {
            let sub = document.getElementById('substrate');
            let stage = document.getElementById('sim-stage');
            
            let stageWidth = stage.offsetWidth;
            let moveDist = stageWidth - 192; // 기질이 이동할 목표 거리 계산
            
            sub.style.transform = 'translateX(-' + moveDist + 'px)'; 
            
            // 0.8초(800ms) 후 결합 성공/실패 판정
            setTimeout(() => {
                if(eShape === sShape) {
                    document.getElementById('status').innerText = '✨ 결합 성공! 효소-기질 복합체가 형성되었습니다.';
                    document.getElementById('status').style.color = '#20C997';
                    setTimeout(() => {
                        sub.style.opacity = '0'; // 생성물로 방출(사라짐)
                        document.getElementById('status').innerText = '⚗️ 반응 완료: 기질이 생성물로 쪼개져 방출되었습니다.';
                    }, 1000);
                } else {
                    document.getElementById('status').innerText = '❌ 결합 실패! 활성 부위와 입체 구조가 맞지 않습니다.';
                    document.getElementById('status').style.color = '#EF4444';
                    // 실패 시 튕겨져 나가는 액션
                    sub.style.transform = 'translateX(-' + (moveDist - 40) + 'px) rotate(25deg)'; 
                }
            }, 800);
        }
      </script>
    </body>
    </html>
    """
    
    components.html(inline_virtual_lab, height=650)


# ==========================================
# [7] 하단 영역 (개념 요약 토글 및 푸터)
# ==========================================
st.write("") 
col_btn1, col_btn2 = st.columns([1, 4])

# 개념 요약 박스 표시 상태를 세션(Session)에 저장
if 'show_concept' not in st.session_state:
    st.session_state.show_concept = False

def toggle_concept():
    st.session_state.show_concept = not st.session_state.show_concept

# 버튼 클릭 시 토글 함수 실행
with col_btn1:
    st.button("📖 개념 요약 보기", on_click=toggle_concept, use_container_width=True)

# 토글이 True일 때만 박스 렌더링
if st.session_state.show_concept:
    # 💡 수정 팁: 요약 텍스트 내용을 바꾸려면 아래 <p> 태그 안의 글씨를 수정하세요.
    st.markdown(f"""
        <div class='concept-box'>
            <h3 style='color: #20C997 !important; margin-bottom:15px; font-weight:800;'>💡 학습 핵심 개념: 효소와 기질 특이성</h3>
            <p><b>1. 활성 부위(Active Site):</b> 효소 단백질의 거대한 입체 구조 중에서 기질과 실제로 맞물려 결합하는 특정한 홈(부위)입니다.</p>
            <p><b>2. 기질 특이성:</b> 효소는 자신의 활성 부위와 삼차원 입체 구조가 딱 맞는 <b>특정 기질하고만 결합하여 반응을 촉매</b>합니다.</p>
            <p><b>3. 현재 관찰 중인 구조:</b> <b>{selected_name}</b> 데이터를 분석하고 있습니다.</p>
        </div>
    """, unsafe_allow_html=True)

# 💡 수정 팁: 사이드바 블로그 주소나 하단 저작권 문구를 바꾸려면 여기를 수정하세요.
st.sidebar.markdown("<br><br><a href='https://blog.naver.com' target='_blank' style='color:#20C997; text-decoration:none; font-weight:800; font-size:1.1rem;'>🌿 BioLogue 블로그 가기</a>", unsafe_allow_html=True)
st.markdown("<br><hr><center>© 2026 BioLogue Lab. Designed for AI Edutech Science Class.</center>", unsafe_allow_html=True)
