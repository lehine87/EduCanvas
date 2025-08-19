const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // 이메일 입력
    await page.type('input[type="email"]', 'sjlee87@kakao.com');
    
    // 비밀번호 입력
    await page.type('input[type="password"]', 'test123456@');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 성공 후 대기
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('로그인 성공! 현재 URL:', page.url());
    
    // 학생 관리 페이지로 이동
    await page.goto('http://localhost:3000/admin/students');
    console.log('학생 관리 페이지 로드 완료');
    
  } catch (error) {
    console.error('로그인 실패:', error.message);
  }
  
  // 브라우저 열어둠 (테스트용)
  // await browser.close();
})();
