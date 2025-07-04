// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 강도 검사
export const getPasswordStrength = (password: string): {
  score: number;
  message: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { score, message: '약함', color: 'text-red-500' };
  } else if (score <= 4) {
    return { score, message: '보통', color: 'text-yellow-500' };
  } else {
    return { score, message: '강함', color: 'text-green-500' };
  }
};

// 캐릭터명 유효성 검사
export const isValidCharacterName = (name: string): boolean => {
  // 2-20자, 한글/영문/숫자/공백 허용
  const nameRegex = /^[가-힣a-zA-Z0-9\s]{2,20}$/;
  return nameRegex.test(name);
};