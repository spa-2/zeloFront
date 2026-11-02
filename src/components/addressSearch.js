import { useKakaoPostcodePopup } from 'react-daum-postcode';

// 백엔드 주소 칸 최대 길이
export const MAX_ADDRESS_LENGTH = 200;

// 카카오 우편번호 결과를 한 줄 주소로 만듦. 도로명 주소면 동 이름과 건물명을 괄호로 붙임
function toAddress(data) {
  const extras = data.addressType === 'R' ? [data.bname, data.buildingName].filter(Boolean) : [];
  return extras.length > 0 ? `${data.address} (${extras.join(', ')})` : data.address;
}

// 주소 찾기 팝업을 여는 함수를 돌려줌. 주소를 고르면 onSelect({ zipCode, address })가 불림
export function useAddressSearch(onSelect) {
  const openPostcode = useKakaoPostcodePopup();
  return () => openPostcode({ onComplete: (data) => onSelect({ zipCode: data.zonecode, address: toAddress(data) }) });
}

// 백엔드는 주소를 한 줄로 받아서 주소와 상세 주소를 쉼표와 공백으로 이어 붙임
export function joinAddress(baseAddress, detailAddress) {
  const base = baseAddress.trim();
  const detail = detailAddress.trim();
  return detail ? `${base}, ${detail}` : base;
}
