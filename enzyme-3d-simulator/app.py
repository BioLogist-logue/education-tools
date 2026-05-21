import streamlit as st
import streamlit.components.v1 as components
import py3Dmol
from stmol import showmol

# 1. 페이지 설정
st.set_page_config(page_title="BioLogue 3D Lab", page_icon="🧬", layout="wide")

# 2. 디자인 CSS (주인님의 소중한 화이트 테마)
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

st.markdown("<div class='main-title'>BioLogue 3D Lab</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>실제 분자 데이터와 가상 실험을 통해 효소의 원리를 마스터합니다.</div>", unsafe_allow_html=True)

# 탭 구성: 1번은 실제 데이터, 2번은 가상 실험
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
        
        if mode == "추천 복합체":
            sel = st.selectbox("효소 선택", list(enzyme_presets.keys()))
            target_pdb = enzyme_presets[sel]
            st.info("💡 기질이 결합된 상태를 관찰합니다.")
        else:
            target_pdb = st.text_input("PDB ID 입력", "1SMD").upper()

    with col2:
        # PDB 렌더링 함수
        viewer = py3Dmol.view(query=f"pdb:{target_pdb}", width=800, height=550)
        viewer.setStyle({'protein': True}, {'cartoon': {'color': 'spectrum'}})
        viewer.addSurface(py3Dmol.VDW, {'opacity': 0.2, 'color': 'white'}, {'protein': True})
        # 기질을 핑크색 구슬로 강조 (강력한 hetatm 선택자 사용)
        viewer.setStyle({'hetatm': True}, {'sphere': {'color': 'magenta', 'radius': 1.2}})
        viewer.zoomTo()
        showmol(viewer, height=550, width=800)

# --- 탭 2: 가상 결합 실험 (투박하지만 괜찮은 그 녀석) ---
with tab2:
    st.markdown("### 🧪 효소-기질 결합 시뮬레이션")
    st.write("다양한 모양의 기질을 투입하여 효소의 활성 부위와 맞는지 확인해 보세요.")
    
    # 투박한 3D 가상 실험실 HTML/JS 코드 임베딩
    virtual_lab_html = """
    <div id="container" style="width: 100%; height: 600px; background: #ffffff; border-radius: 20px; border: 2px solid #E2E8F0; overflow: hidden; position: relative;">
        <iframe src="https://clover-enzyme-docking.vercel.app/" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
    <div style="margin-top: 15px; padding: 15px; background: #F1F5F9; border-radius: 10px; font-size: 0.9rem; color: #475569;">
        <b>💡 실험 방법:</b> 왼쪽 컨트롤러에서 효소의 모양(활성 부위)을 선택하고, 기질을 골라 '기질 투입'을 누르세요. <br>
        모양이 일치하면 결합 후 생성물로 분해되고, 일치하지 않으면 튕겨 나갑니다!
    </div>
    """
    # 띨빡이 팁: 위 주소는 제가 임시로 만든 시뮬레이션 서버입니다. 나중에 주인님이 직접 HTML 파일을 올리실 수도 있어요!
    components.html(virtual_lab_html, height=700)

# 6. 푸터 및 블로그 링크
st.sidebar.markdown("<br><br><a href='https://blog.naver.com' target='_blank' style='color:#20C997; text-decoration:none; font-weight:800; font-size:1.1rem;'>🌿 BioLogue 블로그 가기</a>", unsafe_allow_html=True)
st.markdown("<br><hr><center>© 2026 BioLogue Lab. Designed for AI Edutech Science Class.</center>", unsafe_allow_html=True)
