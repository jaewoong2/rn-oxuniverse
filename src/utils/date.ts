/**
 * Date utility functions
 * KST(한국 표준시) 기준 날짜 처리
 */

/**
 * 오늘 날짜를 KST 기준으로 YYYY-MM-DD 형식으로 반환
 */
export function getTodayKST(): string {
  const now = new Date();

  // UTC 시간을 KST(UTC+9)로 변환
  const kstOffset = 9 * 60; // KST는 UTC+9
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);

  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 날짜 유효성 검사
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = parseDate(dateString);
  return !isNaN(date.getTime());
}

/**
 * 두 날짜의 차이 (일 단위)
 */
export function daysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * N일 전/후 날짜 계산
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 날짜를 로컬 형식으로 표시
 * @example formatDateLocal(new Date()) => "2024년 1월 15일"
 */
export function formatDateLocal(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 날짜를 짧은 형식으로 표시
 * @example formatDateShort(new Date()) => "1월 15일"
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}
