import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// 날짜 포맷팅
export const formatDate = (date: string | Date, format: string = 'YYYY년 MM월 DD일') => {
  return dayjs(date).format(format);
};

// 상대 시간 포맷팅 (예: 3일 전)
export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

// 날짜+시간 포맷팅
export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY년 MM월 DD일 HH:mm');
};

// 숫자를 천 단위로 포맷팅
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR');
};

// 퍼센트 포맷팅
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};