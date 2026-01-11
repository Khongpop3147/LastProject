import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { items, successUrl, cancelUrl } = req.body;

  try {
    // สร้าง line_items จากสินค้าในตะกร้า
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "thb",
        product_data: {
          name: item.product.name,
          images: item.product.imageUrl ? [item.product.imageUrl] : [],
        },
        unit_amount: Math.round((item.product.salePrice ?? item.product.price) * 100), // เป็นสตางค์
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
