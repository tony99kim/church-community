export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 7월 22일</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제1조 (목적)</h2>
          <p>이 약관은 ChurchHub(이하 "서비스")가 제공하는 온라인 커뮤니티 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제2조 (서비스 이용)</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>서비스는 만 14세 이상 이용 가능합니다.</li>
            <li>회원가입 시 정확한 정보를 입력해야 합니다.</li>
            <li>하나의 이메일로 하나의 계정만 생성할 수 있습니다.</li>
            <li>계정의 관리 책임은 이용자 본인에게 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제3조 (금지 행위)</h2>
          <p>다음 행위는 금지됩니다.</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>타인의 명예를 훼손하거나 모욕하는 행위</li>
            <li>음란물, 폭력적 콘텐츠 게시</li>
            <li>허위 정보 또는 스팸 게시</li>
            <li>타인의 개인정보 무단 수집 또는 공유</li>
            <li>서비스 운영을 방해하는 행위</li>
            <li>상업적 광고 목적의 게시물 작성</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제4조 (게시물 관리)</h2>
          <p>서비스는 이용약관에 위반되는 게시물을 사전 통지 없이 삭제할 수 있으며, 반복 위반 시 계정을 정지 또는 삭제할 수 있습니다. 게시물에 대한 저작권은 작성자 본인에게 있으며, 서비스 내 공유 목적으로 사용에 동의한 것으로 간주합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제5조 (서비스 변경 및 중단)</h2>
          <p>서비스는 운영상, 기술적 필요에 의해 서비스 내용을 변경하거나 중단할 수 있습니다. 이 경우 사전에 공지합니다. 단, 긴급한 경우에는 사후 공지할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제6조 (면책 조항)</h2>
          <p>서비스는 이용자가 게시한 콘텐츠로 인한 법적 문제에 대해 책임을 지지 않습니다. 서비스 이용 중 발생한 이용자 간 분쟁에 대해서도 개입하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">제7조 (약관 변경)</h2>
          <p>약관이 변경될 경우 서비스 내 공지사항을 통해 최소 7일 전에 안내합니다. 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
        </section>
      </div>
    </div>
  );
}