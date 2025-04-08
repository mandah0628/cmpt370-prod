import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse form data
    const formData = await request.formData();
    
    // Extract data from the form
    const listingId = formData.get('listingId');
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const totalPrice = formData.get('totalPrice');
    const token = formData.get('token');
    
    // Create reservation data object
    const reservationData = {
      listingId,
      startDate,
      endDate,
      totalPrice
    };
    
    // Store data in query parameter for the create-reservation page
    const queryData = encodeURIComponent(JSON.stringify(reservationData));
    
    // Redirect to the create-reservation page with data
    return NextResponse.redirect(new URL(`/create-reservation?data=${queryData}`, request.url));
  } catch (error) {
    console.error('Error processing reservation:', error);
    return NextResponse.redirect(new URL('/create-reservation?error=true', request.url));
  }
} 