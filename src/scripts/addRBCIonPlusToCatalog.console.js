// Paste this entire block into browser console
(async () => {
  const { supabase } = await import("/src/integrations/supabase/client.ts");
  const { data, error } = await supabase
    .from("card_catalog")
    .insert({
      card_type_id: "rbc-ion+",
      name: "ION+",
      issuer: "RBC",
      network: "visa",
      currency: "CAD",
      points_currency: "Avion Rewards Points",
      reward_currency_id: "e4dc838a-5c0c-420a-893c-329938b0cf1f",
      default_image_url:
        "https://www.rbcroyalbank.com/credit-cards/canada/rewards/images/rbc-ion-plus-visa.webp",
      region: "CA",
      has_categories: false,
      is_active: true,
    })
    .select()
    .single();
  if (error) console.error("Error:", error);
  else console.log("Created:", data);
})();
