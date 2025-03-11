'use client';

import { NextResponse } from "next/server";
import { getClientId } from '@/lib/utils/get-client-id';
import { pb } from '@/lib/utils/pocketbase';

interface ErrorWithStatus {
    status?: number;
    message?: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionName = searchParams.get('sessionName');

        if (!sessionName) {
            return NextResponse.json(
                { error: 'Session name is required' },
                { status: 400 }
            );
        }

        try {
            const clientId = await getClientId(sessionName);
            console.log('Client ID:', clientId);

            try {
                const records = await pb.collection('products').getFullList({
                    filter: `client_id = "${clientId}"`,
                });

                if (records.length > 0) {
                    console.log('Products found:', records.length);
                    return NextResponse.json(records);
                } else {
                    return NextResponse.json(
                        { message: 'No products found for this client' },
                        { status: 404 }
                    );
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                return NextResponse.json(
                    { error: 'Error fetching products' },
                    { status: 500 }
                );
            }
        } catch (error) {
            const err = error as ErrorWithStatus;
            if (err.status === 404) {
                return NextResponse.json(
                    { error: 'Client not found', searchedSessionId: sessionName },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: 'Error getting client ID' },
                { status: 500 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 