import streamlit as st
import streamlit.components.v1 as components
import py3Dmol
from stmol import showmol

# 1. 페이지 설정
st.set_page_config(page_title="BioLogue 3D Lab", page_icon="🧬", layout="wide")

# 2. 디자인 CSS
st.markdown("""
    <style>
    .stApp { background-color: #F8FAFC; }
    html, body, p, h1, h2, h3, h4, h5, h6, span, div, label {
        color: #0F172A !important;
        font-family: 'Pretendard', sans-serif;
    }
    .main-title { color: #0F172A !important; font-size: 3rem; font-weight: 800; text-align: center; margin-bottom: 5px; }
    .sub-title { text-align: center; color: #475569 !important; font-size: 1.2rem; margin-bottom: 2rem; }
    .stTabs [data-baseweb="tab-list"] { gap: 20px; justify-content: center; }
    .stTabs [data-baseweb="tab"] { 
        height: 50px; background-color: #FFFFFF; border-radius: 10px; 
        font-weight: 700; border: 1px solid #E2E8F0; padding: 0 30px;
    }
    .stTabs [aria-selected="true"] { background-color: #20C997 !important; color: white !important; }
    </style>
""", unsafe_allow_html=True)

# 💡 [위치 수정] 함수는 무조건 위에서 미리 선언해 두어야 합니다!
def render_molecule(pdb_id, is_preset=True):
    viewer = py3Dmol.view(query=f"pdb:{pdb_id}", width=800, height=600)
    viewer.setStyle({'cartoon': {'color': 'spectrum'}})
    viewer.addSurface(py3Dmol.VDW, {'opacity': 0.25, 'color': 'white'}, {'protein': True})
    
    if is_preset:
        viewer.setStyle({'hetatm': True}, {'sphere': {'color': 'magenta', 'radius': 1.2}})
    else:
        viewer.setStyle({'hetatm': True}, {'stick': {'colorscheme': 'JmolElements', 'radius': 0.3}})
    
    viewer.zoomTo()
    showmol(viewer, height=600, width=800)

st.markdown("<div class='main-title'>BioLogue 3D Lab</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>실제 분자 데이터와 가상 실험을 통해 효소의 원리를 마스터합니다.</div>", unsafe_allow_html=True)

# 탭 구성
tab1, tab2 = st.tabs(["🔍 실제 구조 관찰 (PDB)", "🧪 가상 결합 실험 (Concept)"])

# --- 탭 1: 실제 PDB 구조 관찰 ---
with tab1:
    col1, col2 = st.columns([1, 3])
    
    enzyme_presets = {
        "리소자임(Lysozyme) + 기질": "1HEW",
        "글루코키나제(Glucokinase) + 포도당": "2H4F",
        "카탈레이스(Catalase)": "1QQW"
    }
    
    with col1:
        st.markdown("### 🔬 관찰 설정")
        mode = st.radio("모드 선택", ["추천 복합체", "직접 검색"], horizontal=True)
        
        # [수정 완료] 들여쓰기를 완벽하게 맞추고, is_preset_mode 변수를 추가했습니다.
        if mode == "추천 복합체":
            sel = st.selectbox("효소 선택", list(enzyme_presets.keys()))
            target_pdb = enzyme_presets[sel]
            is_preset_mode = True
            st.info("💡 기질이 결합된 상태를 관찰합니다.")
        else:
            user_input = st.text_input("RCSB PDB ID 4자리를 입력하세요 (예: 1QQW):", "1QQW")
            target_pdb = user_input.strip().upper()
            is_preset_mode = False
            st.info("🌐 [RCSB PDB 공식 사이트]에서 4자리 코드를 찾아 입력하세요.")
            
    with col2:
        # [수정 완료] 함수를 선언만 하지 않고, 드디어 여기서 "실행"시킵니다!
        if target_pdb:
            render_molecule(target_pdb, is_preset=is_preset_mode)

# --- 탭 2: 가상 결합 실험 (자체 내장형 HTML/JS로 404 에러 영구 차단!) ---
with tab2:
    st.markdown("### 🧪 효소-기질 결합 시뮬레이션 (자물쇠와 열쇠 모델)")
    
    # 💡 404 에러가 나지 않도록 코드를 스트림릿 안에 100% 내장했습니다.
    inline_virtual_lab = """
    <!DOCTYPE html>
    <html>
    <head>
    <style>
      body { font-family: 'Pretendard', sans-serif; display: flex; flex-direction: column; align-items: center; background: #ffffff; padding: 20px; margin: 0; }
      .controls { display: flex; gap: 40px; margin-bottom: 20px; background: #F8FAFC; padding: 20px; border-radius: 15px; border: 1px solid #E2E8F0; }
      .btn { padding: 10px 15px; margin: 5px; border: none; border-radius: 5px; background: #CBD5E1; cursor: pointer; font-weight: bold; color: #0F172A; transition: 0.2s; }
      .btn.active-e { background: #20C997; color: white; }
      .btn.active-s { background: #EC4899; color: white; }
      .stage { width: 500px; height: 300px; border: 2px dashed #94A3B8; border-radius: 15px; position: relative; overflow: hidden; background: #F8FAFC; margin-bottom: 20px; }
      
      /* 효소 디자인 */
      .enzyme { width: 180px; height: 180px; background: #20C997; border-radius: 20px; position: absolute; left: 50px; top: 60px; display: flex; align-items: center; justify-content: flex-end; box-shadow: 5px 5px 15px rgba(0,0,0,0.1); }
      .active-site { width: 60px; height: 60px; background: #F8FAFC; margin-right: -1px; transition: 0.3s; }
      
      /* 기질 디자인 */
      .substrate { width: 56px; height: 56px; background: #EC4899; position: absolute; right: 50px; top: 122px; transition: all 0.8s ease-in-out; box-shadow: 2px 2px 10px rgba(0,0,0,0.2); }
      
      /* 도형 모양 CSS (클립패스 활용) */
      .shape-triangle { clip-path: polygon(100% 50%, 0 0, 0 100%); }
      .shape-square { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
      .shape-circle { border-radius: 50%; width: 58px; height: 58px; }
      
      .action-btn { background: #0F172A; color: white; padding: 15px 40px; font-size: 1.2rem; border-radius: 30px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .action-btn:hover { background: #334155; }
      #status { margin-top: 15px; font-size: 1.2rem; font-weight: bold; color: #475569; }
    </style>
    </head>
    <body>
      <div class="controls">
        <div>
          <h4 style="margin-top:0;">1. 효소 (활성 부위 모양)</h4>
          <button class="btn active-e" id="e-triangle" onclick="setEnzyme('triangle')">세모 홈</button>
          <button class="btn" id="e-square" onclick="setEnzyme('square')">네모 홈</button>
          <button class="btn" id="e-circle" onclick="setEnzyme('circle')">동그란 홈</button>
        </div>
        <div>
          <h4 style="margin-top:0;">2. 투입할 기질 모양</h4>
          <button class="btn active-s" id="s-triangle" onclick="setSubstrate('triangle')">세모 기질</button>
          <button class="btn" id="s-square" onclick="setSubstrate('square')">네모 기질</button>
          <button class="btn" id="s-circle" onclick="setSubstrate('circle')">동그란 기질</button>
        </div>
      </div>
      
      <div class="stage">
        <div class="enzyme"><div id="activeSite" class="active-site shape-triangle"></div></div>
        <div id="substrate" class="substrate shape-triangle"></div>
      </div>
      
      <button class="action-btn" onclick="react()">기질 투입 (반응 시작)</button>
      <div id="status">활성 부위와 기질의 모양을 맞추고 투입해보세요!</div>

      <script>
        let eShape = 'triangle'; let sShape = 'triangle';
        
        function setEnzyme(shape) {
            eShape = shape;
            document.getElementById('activeSite').className = 'active-site shape-' + shape;
            document.querySelectorAll('[id^="e-"]').forEach(b => b.classList.remove('active-e'));
            document.getElementById('e-' + shape).classList.add('active-e');
            resetSubstrate();
        }
        
        function setSubstrate(shape) {
            sShape = shape;
            document.getElementById('substrate').className = 'substrate shape-' + shape;
            document.querySelectorAll('[id^="s-"]').forEach(b => b.classList.remove('active-s'));
            document.getElementById('s-' + shape).classList.add('active-s');
            resetSubstrate();
        }
        
        function resetSubstrate() {
            let sub = document.getElementById('substrate');
            sub.style.transform = 'translateX(0) rotate(0deg)';
            sub.style.opacity = '1';
            document.getElementById('status').innerText = '활성 부위와 기질의 모양을 맞추고 투입해보세요!';
            document.getElementById('status').style.color = '#475569';
        }
        
        function react() {
            let sub = document.getElementById('substrate');
            // 기질이 효소 쪽으로 이동
            sub.style.transform = 'translateX(-212px)'; 
            
            setTimeout(() => {
                if(eShape === sShape) {
                    document.getElementById('status').innerText = '✨ 결합 성공! 효소-기질 복합체가 형성되었습니다.';
                    document.getElementById('status').style.color = '#20C997';
                    setTimeout(() => {
                        sub.style.opacity = '0'; // 생성물로 변환되어 사라짐
                        document.getElementById('status').innerText = '⚗️ 반응 완료: 기질이 생성물로 쪼개져 방출되었습니다.';
                    }, 1000);
                } else {
                    document.getElementById('status').innerText = '❌ 결합 실패! 활성 부위와 입체 구조가 맞지 않습니다.';
                    document.getElementById('status').style.color = '#EF4444';
                    sub.style.transform = 'translateX(-180px) rotate(25deg)'; // 튕겨나감
                }
            }, 800);
        }
      </script>
    </body>
    </html>
    """
    
    # 내장형 HTML을 스트림릿 컴포넌트로 렌더링
    components.html(inline_virtual_lab, height=650)

# 6. 관련 개념 보기/숨기기 (토글 기능)
st.write("") 
col_btn1, col_btn2 = st.columns([1, 4])

if 'show_concept' not in st.session_state:
    st.session_state.show_concept = False

def toggle_concept():
    st.session_state.show_concept = not st.session_state.show_concept

with col_btn1:
    st.button("📖 개념 요약 보기", on_click=toggle_concept, use_container_width=True)

if st.session_state.show_concept:
    st.markdown(f"""
        <div class='concept-box'>
            <h3 style='color: #20C997 !important; margin-bottom:15px; font-weight:800;'>💡 학습 핵심 개념: 효소와 기질 특이성</h3>
            <p><b>1. 활성 부위(Active Site):</b> 효소 단백질의 거대한 입체 구조 중에서 기질과 실제로 맞물려 결합하는 특정한 홈(부위)입니다.</p>
            <p><b>2. 기질 특이성:</b> 효소는 자신의 활성 부위와 삼차원 입체 구조가 딱 맞는 <b>특정 기질하고만 결합하여 반응을 촉매</b>합니다.</p>
            <p><b>3. 현재 관찰 중인 구조:</b> <b>{selected_name}</b> 데이터를 분석하고 있습니다.</p>
        </div>
    """, unsafe_allow_html=True)

# 7. 푸터 및 블로그 링크
st.sidebar.markdown("<br><br><a href='https://blog.naver.com' target='_blank' style='color:#20C997; text-decoration:none; font-weight:800; font-size:1.1rem;'>🌿 BioLogue 블로그 가기</a>", unsafe_allow_html=True)
st.markdown("<br><hr><center>© 2026 BioLogue Lab. Designed for AI Edutech Science Class.</center>", unsafe_allow_html=True)
