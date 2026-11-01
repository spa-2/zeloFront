import { client } from './client';

export async function getAddresses() {
    const res = await client.get('/api/users/me/addresses');
    return res.data.data;
}

export async function createAddress(request) {
    const res = await client.post('/api/users/me/addresses', request);
    return res.data.data;
}

export async function updateAddress(addressId, request) {
    const res = await client.put(`/api/users/me/addresses/${addressId}`, request);
    return res.data.data;
}

export async function deleteAddress(addressId) {
    await client.delete(`/api/users/me/addresses/${addressId}`);
}