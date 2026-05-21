import streamlit as st
import streamlit.components.v1 as components

# 1. 페이지 설정
st.set_page_config(
    page_title="BioLogue 3D Lab",
    page_icon="🧬",
    layout="wide"
)

# 2. 전면 개편! 밝고 눈이 편안한 라이트 테마 CSS
st.markdown("""
    <style>
    /* 전체 배경을 밝은 오프화이트 톤으로 설정 */
    .stApp {
        background-color: #F8FAFC;
    }
    
    /* 화면의 모든 글씨를 진한 남색/검정으로 강제 고정! (가독성 폭발) */
    html, body, p, h1, h2, h3, h4, h5, h6, span, div, label {
        color: #0F172A !important;
        font-family: 'Pretendard', sans-serif;
    }
    
    /* 사이드바를 완전한 흰색으로 분리 */
    [data-testid="stSidebar"] {
        background-color: #FFFFFF !important;
        border-right: 1px solid #E2E8F0;
    }
    
    /* 사이드바 내부 텍스트 굵기 강화 */
    [data-testid="stSidebar"] .stMarkdown p {
        font-size: 1.1rem !important;
        font-weight: 600 !important;
    }

    /* 메인 제목 스타일 */
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

    /* 3D 캔버스 테두리 (밝은 톤) */
    .canvas-box {
        border: 2px solid #CBD5E1;
        border-radius: 20px;
        overflow: hidden;
        background: #FFFFFF;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }

    /* 하단 개념 정리 박스 스타일 */
    .concept-box {
        background: #FFFFFF;
        padding: 25px;
        border-radius: 15px;
        border-left: 5px solid #20C997; /* 브랜드 컬러 포인트 */
        margin-top: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    
    /* 🔥 말썽 부리던 버튼 글씨 가독성 완벽 고정 🔥 */
    .stButton > button {
        background-color: #FFFFFF !important;
        color: #0F172A !important; /* 평상시 진한 남색 글씨 */
        border: 1px solid #CBD5E1 !important;
        font-weight: 700 !important;
        transition: all 0.2s;
    }
    
    /* 마우스 올렸을 때 효과 */
    .stButton > button:hover {
        background-color: #F1F5F9 !important;
        border-color: #20C997 !important;
        color: #20C997 !important; /* 마우스 올리면 초록색 포인트! */
    }
    
    /* 라디오 버튼, 슬라이더 글씨 굵게 */
    .stRadio label, .stSlider label {
        font-weight: 700 !important;
    }
    </style>
    """, unsafe_allow_html=True)

# 3. 사이드바 - 제어 패널
with st.sidebar:
    st.markdown("<h1 style='color: #20C997 !important; font-size: 2.5rem;'>🧬 BioLogue</h1>", unsafe_allow_html=True)
    st.write("**차세대 3D 생명과학 시뮬레이터**")
    st.divider()
    
    st.header("🎮 실험 제어 리모컨")
    
    # 3D 모델 관찰 모드 선택
    mol_view = st.radio(
        "관찰 모드 선택", 
        ["전체 보기", "효소(활성부위) 강조", "기질(이동경로) 확인", "복합체(결합) 분석"],
        index=0
    )
    
    react_speed = st.slider("시뮬레이션 반응 속도", 0.5, 2.0, 1.0)
    
    st.divider()
    if st.button("🔄 실험 초기화", use_container_width=True):
        st.toast("모든 실험 변수가 초기화되었습니다!")

    # 블로그 링크
    st.sidebar.markdown("<br><br><a href='https://blog.naver.com' target='_blank' style='color:#20C997; text-decoration:none; font-weight:800; font-size:1.1rem;'>🌿 BioLogue 블로그 가기</a>", unsafe_allow_html=True)

# 4. 메인 화면 구성
st.markdown("<div class='main-title'>BioLogue 3D Lab</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>생명과학의 복잡한 원리를 직관적인 3D 데이터로 탐구합니다.</div>", unsafe_allow_html=True)

# [임베딩 위치] Spline의 Public URL을 여기에 넣으시면 됩니다.
spline_url = "https://my.spline.design/clonematerialscopy-180b5557257df9b21f3f7e594d24177b/" 

st.markdown("<div class='canvas-box'>", unsafe_allow_html=True)
components.iframe(spline_url, height=650, scrolling=False)
st.markdown("</div>", unsafe_allow_html=True)

# 5. 관련 개념 보기/숨기기 (토글 버튼)
st.write("") 
col_btn1, col_btn2 = st.columns([1, 4])

if 'show_concept' not in st.session_state:
    st.session_state.show_concept = False

def toggle_concept():
    st.session_state.show_concept = not st.session_state.show_concept

with col_btn1:
    st.button("📖 개념 요약 보기", on_click=toggle_concept, use_container_width=True)

# 버튼을 누르면 이 하얀 박스가 열립니다.
if st.session_state.show_concept:
    st.markdown(f"""
        <div class='concept-box'>
            <h3 style='color: #20C997 !important; margin-bottom:15px; font-weight:800;'>💡 학습 핵심 개념: 효소와 기질 특이성</h3>
            <p><b>1. 활성 부위(Active Site):</b> 효소 단백질의 입체 구조 중 기질과 실제로 결합하는 특정 부위입니다.</p>
            <p><b>2. 기질 특이성:</b> 효소는 자신의 활성 부위와 입체 구조가 맞는 <b>특정 기질하고만 결합</b>합니다.</p>
            <p><b>3. 모드 안내:</b> 현재 <b>{mol_view}</b> 모드로 관찰 중입니다. 구조적 특징을 자세히 살펴보세요.</p>
        </div>
    """, unsafe_allow_html=True)

# 6. 푸터
st.markdown(
    "<br><hr><center style='color: #64748B !important; font-size: 0.9rem; font-weight:600;'>"
    "© 2026 BioLogue Lab. Designed for AI Edutech Science Class.</center>", 
    unsafe_allow_html=True
)
