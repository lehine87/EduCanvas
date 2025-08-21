-- Supabase Auth 트리거 함수 구현
-- 새 사용자 등록 시 자동으로 user_profiles 레코드 생성

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 새 사용자 처리 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- user_profiles 테이블에 기본 프로필 생성
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    status,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'pending_approval', -- 기본적으로 승인 대기 상태
    'viewer', -- 기본 역할
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- 오류가 발생해도 사용자 생성은 계속 진행
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 새 사용자 등록 시 자동 프로필 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 사용자 삭제 시 관련 데이터도 함께 삭제하는 함수
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- user_profiles에서 삭제
  DELETE FROM public.user_profiles WHERE id = OLD.id;
  
  -- instructors 테이블에서도 삭제 (있다면)
  DELETE FROM public.instructors WHERE user_id = OLD.id;
  
  RETURN OLD;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to cleanup user data for %: %', OLD.id, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 삭제 트리거
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- 트리거 함수에 대한 설명 추가
COMMENT ON FUNCTION public.handle_new_user() IS 'Auth 사용자 생성 시 자동으로 user_profiles 레코드를 생성하는 함수';
COMMENT ON FUNCTION public.handle_user_delete() IS 'Auth 사용자 삭제 시 관련 데이터를 정리하는 함수';