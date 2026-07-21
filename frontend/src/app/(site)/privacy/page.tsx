export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 7월 22일</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">1. 개인정보의 수집 및 이용 목적</h2>
          <p>ChurchHub(이하 "서비스")는 다음의 목적으로 개인정보를 수집·이용합니다.</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>회원가입 및 서비스 이용을 위한 본인 확인</li>
            <li>커뮤니티 서비스(게시글, 댓글, 행사 참여) 제공</li>
            <li>공지사항 전달 및 서비스 운영</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">2. 수집하는 개인정보의 항목</h2>
          <p className="font-medium mb-1">필수 항목</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>이메일 주소, 비밀번호, 닉네임</li>
          </ul>
          <p className="font-medium mt-3 mb-1">선택 항목</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>전화번호, 프로필 사진</li>
          </ul>
          <p className="font-medium mt-3 mb-1">자동 수집 항목</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>서비스 이용 기록, 접속 로그</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
          <p>회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>소비자 불만 또는 분쟁 처리: 3년 (전자상거래법)</li>
            <li>접속 로그: 3개월 (통신비밀보호법)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
          <p>서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차에 따른 경우는 예외입니다.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">5. 개인정보 보호책임자</h2>
          <p>개인정보 관련 문의는 아래로 연락해주세요.</p>
          <div className="mt-2 bg-gray-50 rounded-xl p-4">
            <p>이메일: admin@churchhub.kr</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">6. 이용자의 권리</h2>
          <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>개인정보 열람, 정정, 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴를 통한 개인정보 삭제</li>
          </ul>
        </section>
      </div>
    </div>
  );
}