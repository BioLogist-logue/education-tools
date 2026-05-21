import streamlit as st
import py3Dmol
from stmol import showmol

# 1. 페이지 설정
st.set_page_config(
    page_title="BioLogue 3D Lab",
    page_icon="🧬",
    layout="wide"
)

# 2. 라이트 테마 CSS 스틸링 (주인님의 완벽한 디자인 유지)
st.markdown("""
    <style>
    .stApp { background-color: #F8FAFC; }
    html, body, p, h1, h2, h3, h4, h5, h6, span, div, label {
        color: #0F172A !important;
        font-family: 'Pretendard', sans-serif;
    }
    [data-testid="stSidebar"] {
        background-color: #FFFFFF !important;
        border-right: 1px solid #E2E8F0;
    }
    [data-testid="stSidebar"] .stMarkdown p {
        font-size: 1.1rem !important;
        font-weight: 600 !important;
    }
    .main-title {
        color: #0F172A !important;
        font-size: 3.5rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 0px;
    }
    .sub-title {
        text-align: center;
        color: #475569 !important;
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 2rem;
    }
    .concept-box {
        background: #FFFFFF;
        padding: 25px;
        border-radius: 15px;
        border-left: 5px solid #20C997;
        margin-top: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    /* 라디오 버튼 및 입력창 글자 강조 */
    div<data-baseline="true"> p {
        font-weight: 700 !important;
    }
    .stButton > button {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        border: 1px solid #CBD5E1 !important;
        font-weight: 700 !important;
        transition: all 0.2s;
    }
    </style>
""", unsafe_allow_html=True)

# 3. 메인 타이틀 레이아웃
st.markdown("<div class='main-title'>BioLogue 3D Lab</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>생명과학의 복잡한 원리를 직관적인 3D 데이터로 탐구합니다.</div>", unsafe_allow_html=True)

# 미리 세팅된 효소-기질 복합체 데이터
enzyme_presets = {
    "리소자임(Lysozyme) + 기질 결합": "1HEW",
    "글루코키나제(Glucokinase) + 포도당 결합": "2H4F"
}

# 💡 [긴급수정] 브라우저가 파업하지 못하게 더 강력한 렌더링 코드로 변경!
def render_molecule(pdb_id, is_preset=True):
    # 빈 도화지 생성
    viewer = py3Dmol.view(query=f"pdb:{pdb_id}", width=800, height=600)
    
    # [핵심 변경] 전체 구조에 기본 스타일을 아주 명확하게 지정 (파업 방지)
    # 1. 일단 무조건 'cartoon' 스타일로 전체를 그립니다.
    viewer.setStyle({'cartoon': {'color': 'spectrum'}})
    
    # 2. 효소 단백질 파트에 반투명 구름 표면을 입힙니다.
    viewer.addSurface(py3Dmol.VDW, {'opacity': 0.25, 'color': 'white'}, {'protein': True})
    
    if is_preset:
        # 추천 모드: 기질(리간드)을 눈에 확 띄는 핫핑크색 왕구슬로 강조!
        # [긴급수정] 'hetatm' (이종 원자) 선택자를 추가해서 기질을 더 확실하게 잡습니다.
        viewer.setStyle({'hetatm': True}, {'sphere': {'color': 'magenta', 'radius': 1.2}})
    else:
        # 자유 검색 모드: 표준 원소 색상의 스틱 형태로 표현
        viewer.setStyle({'hetatm': True}, {'stick': {'colorscheme': 'JmolElements', 'radius': 0.3}})
    
    # 3. 화면 크기에 딱 맞게 줌인 및 출력
    viewer.zoomTo()
    showmol(viewer, height=600, width=800)

# 4. 탐구 모드 선택 (라디오 버튼 디자인)
explore_mode = st.radio(
    "💡 탐구 방식을 선택하세요:",
    ["교과서 추천 복합체 관찰하기", "새로운 PDB ID 직접 검색하기"],
    horizontal=True
)

st.write("---")

# 5. 메인 콘텐츠 화면 분할
col1, col2 = st.columns([1, 3])

with col1:
    st.markdown("### 🔬 컨트롤 패널")
    
    if explore_mode == "교과서 추천 복합체 관찰하기":
        selected_name = st.selectbox("관찰할 효소 세트를 고르세요:", list(enzyme_presets.keys()))
        target_pdb = enzyme_presets[selected_name]
        is_preset_mode = True
        st.success("🎯 핑크색 구슬 모양이 '기질(Substrate)'입니다! 마우스로 돌려보며 활성 부위에 자물쇠와 열쇠처럼 딱 들어맞은 입체 구조를 확인해 보세요.")
    
    else:
        user_input = st.text_input("RCSB PDB ID 4자리를 입력하세요 (예: 1QQW, 1SMD, 1G05):", "1QQW")
        target_pdb = user_input.strip().upper()
        selected_name = f"사용자 정의 검색 ({target_pdb})"
        is_preset_mode = False
        st.info("🌐 [RCSB PDB 공식 사이트](https://www.rcsb.org/)에서 원하는 단백질의 4자리 코드를 찾아 입력하면 전 세계 모든 생체 분자를 3D로 불러올 수 있습니다.")

with col2:
    if target_pdb:
        try:
            render_molecule(target_pdb, is_preset=is_preset_mode)
        except Exception as e:
            st.error("❌ PDB ID를 불러오지 못했습니다. 올바른 4자리 코드인지 확인해 주세요!")

# 사이드바 블로그 링크
st.sidebar.markdown("<br><br><a href='https://blog.naver.com' target='_blank' style='color:#20C997; text-decoration:none; font-weight:800; font-size:1.1rem;'>🌿 BioLogue 블로그 가기</a>", unsafe_allow_html=True)

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

# 7. 푸터
st.markdown(
    "<br><hr><center style='color: #64748B !important; font-size: 0.9rem; font-weight:600;'>"
    "© 2026 BioLogue Lab. Designed for AI Edutech Science Class.</center>", 
    unsafe_allow_html=True
)
