import { client } from './client';

// 로그인 없이 볼 수 있는 상품 API
export async function searchProducts({ keyword = '', categoryId, inStock, sort, page = 0, size = 20 } = {}) {
  const res = await client.get('/api/products', { params: { keyword, categoryId, inStock, sort, page, size } });
  return res.data.data;
}

export async function getProduct(productCode) {
  const res = await client.get(`/api/products/${productCode}`);
  return res.data.data;
}

export async function getCategories() {
  const res = await client.get('/api/categories');
  return res.data.data;
}

export async function getPopularProducts() {
  const res = await client.get('/api/products/popular');
  return res.data.data;
}

export async function getPopularKeywords() {
  const res = await client.get('/api/products/popular-keywords');
  return res.data.data;
}

export async function autocomplete(keyword) {
  const res = await client.get('/api/products/autocomplete', { params: { keyword } });
  return res.data.data;
}
