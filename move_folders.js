// move-folders.js
// 📌 Node.js 기반 폴더/파일 이동 스크립트
// 실행: node move-folders.js

const fs = require("fs");
const path = require("path");

const moves = [
  // components
  ["src/components/class-manager", "src/components/classes"],
  ["src/components/student", "src/components/students"],
  ["src/components/analytics", "src/components/analytics"], // 그대로 두지만 구조 정리 가능
  ["src/components/modals", "src/components/ui/modals"],
  ["src/components/auth", "src/components/auth"],

  // store
  ["src/store/useClassStore.ts", "src/store/classesStore.ts"],
  ["src/store/useStudentStore.ts", "src/store/studentsStore.ts"],
  ["src/store/useColumnStore.ts", "src/config/columns/useColumnStore.ts"],

  // lib / utils
  ["src/lib/supabase.ts", "src/lib/db/supabaseClient.ts"],
  ["src/lib/auth.ts", "src/lib/auth/index.ts"],
  ["src/utils/constants.ts", "src/config/constants.ts"],
  ["src/utils/validators.ts", "src/lib/validations.ts"],

  // hooks
  ["src/hooks/useDragAndDrop.ts", "src/features/dnd/hooks.ts"],
  ["src/hooks/useAuth.ts", "src/features/auth/hooks.ts"],

  // types
  ["src/types/student.ts", "src/types/students.ts"],
  ["src/types/class.ts", "src/types/classes.ts"],

  // app routes
  ["src/app/(admin)/class-manager", "src/app/(admin)/classes"],
];

// 폴더 생성 함수
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Created directory: ${dir}`);
  }
}

// 파일/폴더 이동 함수
function moveItem(from, to) {
  const fromPath = path.resolve(from);
  const toPath = path.resolve(to);
  ensureDir(path.dirname(toPath));
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`✅ Moved: ${from} → ${to}`);
  } else {
    console.warn(`⚠️ Not found: ${from}`);
  }
}

// 실행
moves.forEach(([from, to]) => moveItem(from, to));

console.log("🚀 Folder structure migration completed!");
