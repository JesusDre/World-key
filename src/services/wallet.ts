import { apiRequest } from './api';

export interface Card {
    id: string;
    type: string;
    brand: string;
    address: unknown;
    card_number: string;
    holder_name: string;
    expiration_year: string;
    expiration_month: string;
    allows_charges: boolean;
    allows_payouts: boolean;
    creation_date: string;
    bank_name: string;
    customer_id: string;
    bank_code: string;
}

export async function getCards(token: string): Promise<Card[]> {
    return apiRequest<Card[]>('wallet/cards', { token });
}

export async function addCard(token: string, tokenId: string, deviceSessionId: string): Promise<Card> {
    return apiRequest<Card>('wallet/cards', {
        method: 'POST',
        token,
        body: { tokenId, deviceSessionId }
    });
}

export async function deleteCard(token: string, cardId: string): Promise<void> {
    return apiRequest<void>(`wallet/cards/${cardId}`, {
        method: 'DELETE',
        token
    });
}
