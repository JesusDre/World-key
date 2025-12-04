import { apiRequest } from './api';

export interface Card {
    id: string;
    type: string;
    brand: string;
    address: unknown;
    cardNumber: string;
    holderName: string;
    expirationYear: string;
    expirationMonth: string;
    allowsCharges: boolean;
    allowsPayouts: boolean;
    creationDate: string;
    bankName: string;
    customerId: string;
    bankCode: string;
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
