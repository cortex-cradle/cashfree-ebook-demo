// netlify/functions/create-order.js
const cashfree = require('cashfree-pg');

// ⚠️ IMPORTANT: Yeh keys Netlify Environment Variables se aayengi!
const CF_APP_ID = TEST10727480311a8687b61950f38f4608472701; 
const CF_SECRET_KEY = cfsk_ma_test_a56235cab7fddc9b11340a202d8b2bc8_a9f7b00a;
// Agar aap PROD keys use kar rahe hain toh 'PRODUCTION' rakho, varna 'SANDBOX'
const CF_ENV = cashfree.Cashfree.Environment.SANDBOX;   

// Cashfree SDK ko initialize karna
cashfree.Cashfree.init(CF_ENV, CF_APP_ID, CF_SECRET_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);

        const { order_id, order_amount, customer_name, customer_phone, customer_email, ebookId } = data;

        const createOrderRequest = {
            order_id: order_id,
            order_amount: parseFloat(order_amount), 
            order_currency: 'INR',
            customer_details: {
                // Pre-fill ke liye details
                customer_id: customer_phone, 
                customer_phone: customer_phone,
                customer_name: customer_name,
                customer_email: customer_email
            },
            order_meta: {
                // Success hone par wapas aane wala URL
                return_url: `https://${event.headers.host}/success.html?order_id={order_id}&status={payment_status}`,
                custom_notes: {
                    ebook_purchased: ebookId 
                }
            },
            order_expiry_time: Math.floor(Date.now() / 1000) + (15 * 60)
        };

        const response = await cashfree.PG.Order.create(CF_ENV, createOrderRequest);

        if (response.status === 'OK' && response.data.payment_link) {
            return {
                statusCode: 200,
                body: JSON.stringify({ payment_link: response.data.payment_link })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Failed to create Cashfree Order', cf_error: response.data })
            };
        }

    } catch (error) {
        console.error("Cashfree API Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }

};


