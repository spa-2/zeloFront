// 주문 상세의 칸 하나. rows는 [이름, 값] 목록이고 값이 없는 줄은 빼고 보여 줌
export default function OrderSection({ title, rows = [], children }) {
    const visibleRows = rows.filter(([, value]) => value != null && value !== '');
    return (
        <section className="flex flex-col gap-3 rounded-3xl border-2 border-zelo-green bg-zelo-card p-6">
            <h2 className="font-display text-2xl text-zelo-green">{title}</h2>
            {visibleRows.length > 0 && (
                <dl className="flex flex-col gap-2 text-sm">
                    {visibleRows.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                            <dt className="shrink-0 text-zelo-sub">{label}</dt>
                            <dd className="text-right font-medium">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {children}
        </section>
    );
}