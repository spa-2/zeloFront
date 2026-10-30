import { Link } from 'react-router-dom';
import '../styles/products.css';

// 상품 카드. 메인 인기 상품과 상품 목록에서 같이 씀. rank를 주면 왼쪽 위에 순위를 붙임
export default function ProductCard({ product, rank }) {
  const soldOut = (product.availableQuantity ?? 0) <= 0;
  return (
    <Link to={`/products/${product.productCode}`} className={`product-card${soldOut ? ' out' : ''}`}>
      <div className="product-thumb">
        {rank && <b className="product-rank">{rank}</b>}
        {soldOut && <b className="soldout-badge">SOLD OUT</b>}
        <span>{product.categoryName}</span>
      </div>
      <div className="product-info">
        <span className="brand">{product.brand}</span>
        <span className="name">{product.name}</span>
        <span className="row2">
          <span className="price">{product.price.toLocaleString()}원</span>
          <span className="unit">{product.unitLabel}</span>
        </span>
      </div>
    </Link>
  );
}
