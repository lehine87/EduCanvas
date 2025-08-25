const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 UI 테스트 시작...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    // 로그인 페이지로 이동
    console.log('📋 1. 로그인 페이지 접속...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // 로그인 처리
    console.log('🔐 2. 로그인 처리...');
    await page.type('input[type="email"]', 'sjlee87@kakao.com');
    await page.type('input[type="password"]', 'test123456@');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // 학생 관리 페이지로 이동
    console.log('📚 3. 학생 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/students');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Phase 1 테스트: 검색 중심 홈 확인
    console.log('🎯 Phase 1 테스트: 검색 중심 홈 인터페이스');
    
    // 메인 제목 확인
    const title = await page.$eval('h1', el => el.textContent);
    console.log('✅ 메인 제목:', title);
    
    // 검색창 확인
    const searchBox = await page.$('input[placeholder*="검색"]');
    if (searchBox) {
      console.log('✅ 검색창 발견됨');
      // 검색 테스트
      await page.type('input[placeholder*="검색"]', '김');
      console.log('✅ 검색어 입력 테스트 완료');
      await page.keyboard.press('Backspace');
    } else {
      console.log('❌ 검색창을 찾을 수 없음');
    }
    
    // 최근 조회 학생 섹션 확인
    const recentStudentsSection = await page.$('h2:contains("최근 조회 학생")');
    if (recentStudentsSection) {
      console.log('✅ 최근 조회 학생 섹션 발견됨');
    } else {
      console.log('ℹ️ 최근 조회 학생 데이터 없음 (정상)');
    }
    
    // 빠른 작업 버튼 확인
    console.log('🚀 빠른 작업 버튼 테스트...');
    const quickActionButtons = await page.$$('h2:contains("빠른 작업") + div [role="button"]');
    console.log(`✅ 빠른 작업 버튼 ${quickActionButtons.length}개 발견`);
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'C:\\Users\\Carl\\OneDrive\\EduCanvas\\test_screenshot_main.png',
      fullPage: true 
    });
    console.log('📸 메인 페이지 스크린샷 저장됨');
    
    // 학생 데이터가 있는지 확인
    const studentCards = await page.$$('[data-testid="student-card"], .student-card, [class*="StudentCard"]');
    console.log(`👥 학생 카드 ${studentCards.length}개 발견`);
    
    if (studentCards.length > 0) {
      console.log('🎯 Phase 2 테스트: 5탭 상세 페이지');
      // 첫 번째 학생 카드 클릭
      await studentCards[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // 탭 시스템 확인
      const tabs = await page.$$('[role="tab"], [class*="tab"]');
      console.log(`📑 탭 ${tabs.length}개 발견`);
      
      if (tabs.length >= 5) {
        console.log('✅ 5탭 시스템 구현됨');
        
        // 각 탭 클릭 테스트
        for (let i = 0; i < Math.min(tabs.length, 5); i++) {
          await tabs[i].click();
          await page.waitForTimeout(500);
          console.log(`✅ 탭 ${i + 1} 클릭 테스트 완료`);
        }
      }
      
      // 상세 페이지 스크린샷
      await page.screenshot({ 
        path: 'C:\\Users\\Carl\\OneDrive\\EduCanvas\\test_screenshot_detail.png',
        fullPage: true 
      });
      console.log('📸 상세 페이지 스크린샷 저장됨');
    } else {
      console.log('ℹ️ 학생 데이터가 없어 상세 페이지 테스트 스킵');
    }
    
    console.log('🎉 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await page.screenshot({ 
      path: 'C:\\Users\\Carl\\OneDrive\\EduCanvas\\test_screenshot_error.png' 
    });
  }
  
  // 브라우저를 5초 후 닫음
  setTimeout(async () => {
    console.log('🔚 테스트 완료, 브라우저 종료...');
    await browser.close();
  }, 5000);
})();