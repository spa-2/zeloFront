import { useEffect, useState } from 'react';

// 인증 메일 재전송처럼 연타를 막을 버튼에 씀. start()를 부르면 seconds초 동안 remaining이 줄어듦
export default function useCooldown(seconds) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return [remaining, () => setRemaining(seconds)];
}
