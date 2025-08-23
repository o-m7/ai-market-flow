import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("CREATE-CHECKOUT: Function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("CREATE-CHECKOUT: Starting checkout process");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("CREATE-CHECKOUT: STRIPE_SECRET_KEY not configured");
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    console.log("CREATE-CHECKOUT: Stripe key found");

    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) {
      console.error("CREATE-CHECKOUT: No authorization header");
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      console.error("CREATE-CHECKOUT: User not authenticated");
      throw new Error("User not authenticated or email not available");
    }
    console.log("CREATE-CHECKOUT: User authenticated:", user.email);

    const { priceId, tier } = await req.json();
    console.log("CREATE-CHECKOUT: Received data:", { priceId, tier });
    
    if (!priceId) {
      console.error("CREATE-CHECKOUT: Price ID is required");
      throw new Error("Price ID is required");
    }

    // Check if price ID is a placeholder
    if (priceId.startsWith('price_monthly_') || priceId.startsWith('price_yearly_')) {
      console.error("CREATE-CHECKOUT: Placeholder price ID detected:", priceId);
      throw new Error(`Please configure real Stripe price IDs. Current price ID '${priceId}' is a placeholder. Create products in your Stripe dashboard and update the price IDs in the pricing page.`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log("CREATE-CHECKOUT: Stripe initialized");
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("CREATE-CHECKOUT: Found existing customer:", customerId);
    } else {
      console.log("CREATE-CHECKOUT: No existing customer found");
    }

    console.log("CREATE-CHECKOUT: Creating checkout session...");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/payment-success`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        tier: tier,
        user_id: user.id,
      },
    });

    console.log("CREATE-CHECKOUT: Checkout session created successfully:", session.id);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("CREATE-CHECKOUT: Error occurred:", error.message);
    console.error("CREATE-CHECKOUT: Full error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check the edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});