// 카카오 우편번호 결과를 한 줄 주소로 만듦. 도로명 주소면 동 이름과 건물명을 괄호로 붙임
export default function toAddress(data) {
  const extras = data.addressType === 'R' ? [data.bname, data.buildingName].filter(Boolean) : [];
  return extras.length > 0 ? `${data.address} (${extras.join(', ')})` : data.address;
}
